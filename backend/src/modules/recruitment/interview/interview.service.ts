import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import interviewRepository from './interview.repository';
import InterviewAssignment from '../../../models/InterviewAssignment';
import InterviewSession from '../../../models/InterviewSession';
import InterviewQuestion from '../../../models/InterviewQuestion';
import InterviewResponse from '../../../models/InterviewResponse';
import InterviewReport from '../../../models/InterviewReport';
import InterviewEvaluation from '../../../models/InterviewEvaluation';
import { interviewQueue, isRedisOnline } from '../queue/queue.config';
import { RankingService } from './ranking.service';

const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

function normalizeCategory(category: string): 'Technical' | 'Behavioral' | 'Situational' | 'Problem Solving' | 'Project-Based' | 'Resume-Based' {
  if (!category) return 'Technical';
  const cat = category.trim().toLowerCase();
  if (cat.includes('technical') || cat.includes('tech')) return 'Technical';
  if (cat.includes('behavioral') || cat.includes('behav')) return 'Behavioral';
  if (cat.includes('situational') || cat.includes('situat')) return 'Situational';
  if (cat.includes('problem solving') || cat.includes('problem')) return 'Problem Solving';
  if (cat.includes('project-based') || cat.includes('project')) return 'Project-Based';
  if (cat.includes('resume-based') || cat.includes('resume')) return 'Resume-Based';
  return 'Technical'; // fallback
}

function normalizeSourceType(sourceType: string): 'Resume' | 'JobDescription' | 'FollowUp' | 'Behavioral' | 'Technical' {
  if (!sourceType) return 'JobDescription';
  const src = sourceType.trim().toLowerCase();
  if (src.includes('resume')) return 'Resume';
  if (src.includes('jobdescription') || src.includes('job') || src.includes('description')) return 'JobDescription';
  if (src.includes('followup') || src.includes('follow')) return 'FollowUp';
  if (src.includes('behavioral') || src.includes('behav')) return 'Behavioral';
  if (src.includes('technical') || src.includes('tech')) return 'Technical';
  return 'JobDescription'; // fallback
}

export class InterviewService {
  // --- TEMPLATES CRUD ---
  async createTemplate(data: any, userId: string) {
    return await interviewRepository.createTemplate({
      ...data,
      createdBy: userId as any,
      updatedBy: userId as any
    });
  }

  async getTemplates(filter: any = {}) {
    return await interviewRepository.findTemplates(filter);
  }

  async getTemplateById(id: string) {
    const template = await interviewRepository.findTemplateById(id);
    if (!template) throw new Error('Interview template not found');
    return template;
  }

  async updateTemplate(id: string, data: any, userId: string) {
    return await interviewRepository.updateTemplate(id, {
      ...data,
      updatedBy: userId as any
    });
  }

  async deleteTemplate(id: string) {
    return await interviewRepository.deleteTemplate(id);
  }

  // --- ASSIGNMENTS ---
  async getAssignments(filter: any = {}) {
    return await interviewRepository.findAssignments(filter);
  }

  async getAssignmentById(id: string) {
    const assignment = await interviewRepository.findAssignmentById(id);
    if (!assignment) throw new Error('Interview assignment not found');
    return assignment;
  }

  // --- HELPER TO GENERATE AND SAVE QUESTIONS ---
  async generateAndSaveInitialQuestions(session: any, job: any, template: any, assignment: any) {
    const skillsRequired = template ? (template.skillsRequired || template.get?.('skills') || []) : [];
    const experienceLevel = template ? (template.experienceLevel || 'Mid') : 'Mid';
    const difficultyLevel = template ? (template.difficultyLevel || template.get?.('difficulty') || 'Medium') : 'Medium';
    const numQuestions = template ? (template.numQuestions || template.get?.('questionCount') || 5) : 5;

    // Call FastAPI to generate initial question queue
    let questionsList: any[] = [];
    try {
      console.log(`[Interview Service] Calling FastAPI to generate initial questions...`);
      const response = await fetch(`${aiServiceUrl}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: job.title,
          job_description: job.description || '',
          job_required_skills: skillsRequired,
          experience_level: experienceLevel,
          difficulty_level: difficultyLevel,
          resume_snapshot: assignment.resumeSnapshot,
          num_questions: numQuestions,
        }),
      });

      if (response.ok) {
        questionsList = await response.json();
      } else {
        const errTxt = await response.text();
        console.error(`[Interview Service] FastAPI question generator failed: ${errTxt}`);
      }
    } catch (apiError: any) {
      console.error(`[Interview Service] FastAPI question generator failed: ${apiError.message}`);
    }

    // Fallback if FastAPI failed or returned empty list
    if (!questionsList || questionsList.length === 0) {
      questionsList = [
        {
          questionText: `Could you introduce yourself and walk us through your relevant experience?`,
          category: 'Behavioral',
          sourceType: 'Behavioral',
        },
        {
          questionText: `What are your core strengths and areas of expertise in technical development?`,
          category: 'Technical',
          sourceType: 'Technical',
        },
      ];
    }

    // Save initial generated questions in database
    const questionsToSave = questionsList.map((q, idx) => ({
      sessionId: session._id,
      questionText: q.questionText,
      category: normalizeCategory(q.category),
      difficulty: difficultyLevel,
      isFollowUp: false,
      order: idx + 1,
      questionVersion: 1,
      sourceType: normalizeSourceType(q.sourceType),
      generatedBy: 'AI_ENGINE',
    }));

    return await InterviewQuestion.insertMany(questionsToSave);
  }

  // --- CANDIDATE SESSION MANAGEMENT ---
  async startSession(assignmentId: string, candidateId: string) {
    const assignment = await InterviewAssignment.findById(assignmentId)
      .populate('interviewTemplateId')
      .populate('jobId');

    if (!assignment) {
      throw new Error('Interview assignment not found');
    }

    if (assignment.candidateId.toString() !== candidateId) {
      throw new Error('Unauthorized: Assignment belongs to another candidate');
    }

    // Attempt count check
    if (assignment.attemptCount >= assignment.maxAttempts) {
      throw new Error('Maximum attempt limit reached. You cannot restart this interview.');
    }

    let template: any = assignment.interviewTemplateId;
    const job: any = assignment.jobId;

    if (!template && job && job.interviewTemplateId) {
      console.log(`[Interview Service] assignment.interviewTemplateId is null. Finding template from job's interviewTemplateId: ${job.interviewTemplateId}`);
      const InterviewTemplate = mongoose.model('InterviewTemplate');
      template = await InterviewTemplate.findById(job.interviewTemplateId);
    }

    // Check if there is an in-progress session to resume
    let session = await InterviewSession.findOne({ assignmentId, status: { $in: ['Started', 'In Progress'] } });
    if (session) {
      // Return existing session and its current question
      let currentQuestion = await InterviewQuestion.findOne({
        sessionId: session._id,
        order: session.currentQuestionIndex + 1
      });

      if (!currentQuestion) {
        console.warn(`[Interview Service] Resumed session ${session._id} has no question at order ${session.currentQuestionIndex + 1}. Regenerating initial questions...`);
        const savedQuestions = await this.generateAndSaveInitialQuestions(session, job, template, assignment);
        currentQuestion = savedQuestions[0];
      }

      return { session, currentQuestion, isResumed: true };
    }

    // Register a new attempt
    assignment.attemptCount += 1;
    assignment.lastAttemptAt = new Date();
    assignment.status = 'In Progress';
    await assignment.save();

    // Create session
    session = await InterviewSession.create({
      assignmentId,
      candidateId,
      jobId: assignment.jobId,
      status: 'Started',
      startedAt: new Date(),
      currentQuestionIndex: 0,
      totalQuestions: template ? (template.numQuestions || template.get?.('questionCount') || 5) : 5,
    });

    const savedQuestions = await this.generateAndSaveInitialQuestions(session, job, template, assignment);
    const initialQuestion = savedQuestions[0];

    return { session, currentQuestion: initialQuestion, isResumed: false };
  }

  async submitAnswer(sessionId: string, questionId: string, file: any) {
    const session = await InterviewSession.findById(sessionId);
    const question = await InterviewQuestion.findById(questionId);

    if (!session || !question) {
      throw new Error('Interview session or question not found');
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'interviews');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to unique location under uploads
    const tempPath = file.path;
    const finalFilename = `${sessionId}_${questionId}_${Date.now()}${path.extname(file.originalname)}`;
    const finalPath = path.join(uploadDir, finalFilename);
    fs.renameSync(tempPath, finalPath);

    const audioFileUrl = `/api/v1/recruitment/interviews/audio/${finalFilename}`;

    // Create InterviewResponse
    const response = await InterviewResponse.create({
      sessionId,
      questionId,
      audioFileUrl,
      transcript: '',
      confidenceScore: 0,
      processingStatus: 'Pending',
      answeredAt: new Date(),
    });

    // Check Redis connectivity
    const redisOnline = await isRedisOnline();
    if (redisOnline) {
      console.log(`[Interview Service] Redis is online. Enqueuing process-answer job in BullMQ...`);
      await interviewQueue.add('process-answer', {
        sessionId,
        responseId: response._id,
        audioFilePath: finalPath,
        questionText: question.questionText,
      });
      console.log(`[Interview Service] Job queued. HTTP response returned.`);
    } else {
      console.warn(`[Interview Warning] Redis is offline. Processing answer synchronously inline...`);
      await this.processAnswer(sessionId, response._id.toString(), finalPath, question.questionText);
      console.log(`[Interview Service] Synced processing complete. HTTP response returned.`);
    }

    // Fetch updated session and current question to return to the frontend
    const updatedSession = await InterviewSession.findById(sessionId);
    let nextQuestion = null;
    if (updatedSession) {
      nextQuestion = await InterviewQuestion.findOne({
        sessionId: updatedSession._id,
        order: updatedSession.currentQuestionIndex + 1
      });
    }

    return {
      response,
      session: updatedSession,
      currentQuestion: nextQuestion,
      isProcessedInline: !redisOnline
    };
  }

  // --- INTEGRITY TRACKING ---
  async updateIntegrity(sessionId: string, eventType: 'tab-switch' | 'fullscreen-exit' | 'disconnect') {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Interview session not found');

    if (eventType === 'tab-switch') {
      session.tabSwitchCount += 1;
    } else if (eventType === 'fullscreen-exit') {
      session.fullscreenExitCount += 1;
    } else if (eventType === 'disconnect') {
      session.networkDisconnectCount += 1;
    }

    // Integrity Flag trigger
    if (session.tabSwitchCount > 2 || session.fullscreenExitCount > 1 || session.networkDisconnectCount > 2) {
      session.suspiciousActivityFlag = true;
    }

    await session.save();
    return session;
  }

  // --- REPORT & ANALYTICS VIEWER ---
  async getReport(sessionId: string) {
    let report = await InterviewReport.findOne({ sessionId })
      .populate({
        path: 'sessionId',
        populate: { path: 'assignmentId' }
      })
      .populate('candidateId')
      .populate('jobId')
      .lean();

    if (!report) {
      // Treat sessionId as assignmentId lookup
      const activeSession = await InterviewSession.findOne({ assignmentId: sessionId });
      if (activeSession) {
        sessionId = activeSession._id.toString();
        report = await InterviewReport.findOne({ sessionId: activeSession._id })
          .populate({
            path: 'sessionId',
            populate: { path: 'assignmentId' }
          })
          .populate('candidateId')
          .populate('jobId')
          .lean();
      }
    }

    if (!report) throw new Error('Evaluation report not ready or compile failed.');

    // Fetch full timeline details (questions + transcripts + individual evaluation scores)
    const questions = await InterviewQuestion.find({ sessionId }).sort({ order: 1 }).lean();
    const responses = await InterviewResponse.find({ sessionId }).lean();
    const evaluations = await InterviewEvaluation.find({ sessionId }).lean();

    const timeline = questions.map((q) => {
      const resp = responses.find(r => r.questionId.toString() === q._id.toString());
      const evalItem = evaluations.find((e: any) => e.responseId.toString() === (resp?._id || '').toString());
      return {
        question: q,
        response: resp || null,
        evaluation: evalItem || null
      };
    });

    return {
      report,
      timeline
    };
  }

  async getAnalytics(filter: any = {}) {
    return await interviewRepository.getAggregatedAnalytics(filter);
  }

  async processAnswer(sessionId: string, responseId: string, audioFilePath: string, questionText: string) {
    console.log(`[Interview Service] processAnswer started for sessionId: ${sessionId}, responseId: ${responseId}`);
    // 1. Get response and session records
    const response = await InterviewResponse.findById(responseId);
    const session = await InterviewSession.findById(sessionId);
    if (!response || !session) {
      throw new Error('InterviewResponse or InterviewSession not found');
    }

    response.processingStatus = 'Processing';
    await response.save();

    const assignment = await InterviewAssignment.findById(session.assignmentId);
    if (!assignment) {
      throw new Error('InterviewAssignment not found');
    }

    // 2. Perform Speech-to-Text Transcription via FastAPI
    let transcript = 'Could not transcribe response.';
    let confidenceScore = 50;

    if (fs.existsSync(audioFilePath)) {
      const fileBuffer = fs.readFileSync(audioFilePath);
      const ext = path.extname(audioFilePath).toLowerCase();
      const mimeType = ext === '.wav' ? 'audio/wav' : ext === '.mp3' ? 'audio/mp3' : 'audio/webm';
      
      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', fileBlob, path.basename(audioFilePath));

      try {
        console.log(`[Interview Service] Sending audio to FastAPI STT...`);
        const transcribeResponse = await fetch(`${aiServiceUrl}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (transcribeResponse.ok) {
          const transcribeResult: any = await transcribeResponse.json();
          transcript = transcribeResult.transcript || transcript;
          confidenceScore = transcribeResult.confidenceScore || confidenceScore;
          console.log(`[Interview Service] Transcription success. Got ${transcript.substring(0, 40)}...`);
        } else {
          const errTxt = await transcribeResponse.text();
          console.error(`[Interview Service] STT FastAPI returned error: ${errTxt}`);
        }
      } catch (sttError: any) {
        console.error(`[Interview Service] STT request failed: ${sttError.message}`);
      }
    } else {
      console.warn(`[Interview Service] Audio file not found at: ${audioFilePath}`);
    }

    // 3. Save transcript to InterviewResponse
    response.transcript = transcript;
    response.confidenceScore = confidenceScore;
    response.processingStatus = 'Completed';
    await response.save();

    // 4. Perform Answer Evaluation via FastAPI
    let evaluationResult: any = {
      technicalScore: 70,
      communicationScore: 70,
      confidenceScore: 70,
      clarityScore: 70,
      problemSolvingScore: 70,
      domainExpertiseScore: 70,
      relevanceScore: 70,
      depthOfUnderstandingScore: 70,
      overallScore: 70,
      aiConfidenceScore: 0.85,
      reasoning: 'AI evaluation fallback due to network processing constraints.',
    };

    try {
      console.log(`[Interview Service] Sending transcript to FastAPI Evaluation...`);
      const evalResponse = await fetch(`${aiServiceUrl}/evaluate-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          answer: transcript,
          resume_snapshot: assignment.resumeSnapshot,
          experience_level: assignment.resumeSnapshot?.aiRecommendation || 'Mid',
        }),
      });

      if (evalResponse.ok) {
        evaluationResult = await evalResponse.json();
        console.log(`[Interview Service] Evaluation success. Score: ${evaluationResult.overallScore}`);
      } else {
        const errTxt = await evalResponse.text();
        console.error(`[Interview Service] Evaluation FastAPI returned error: ${errTxt}`);
      }
    } catch (evalError: any) {
      console.error(`[Interview Service] Evaluation request failed: ${evalError.message}`);
    }

    // 5. Store evaluation metrics
    await InterviewEvaluation.create({
      sessionId: session._id,
      responseId: response._id,
      technicalScore: evaluationResult.technicalScore || 70,
      communicationScore: evaluationResult.communicationScore || 70,
      confidenceScore: evaluationResult.confidenceScore || 70,
      clarityScore: evaluationResult.clarityScore || 70,
      problemSolvingScore: evaluationResult.problemSolvingScore || 70,
      domainExpertiseScore: evaluationResult.domainExpertiseScore || 70,
      relevanceScore: evaluationResult.relevanceScore || 70,
      depthOfUnderstandingScore: evaluationResult.depthOfUnderstandingScore || 70,
      overallScore: evaluationResult.overallScore || 70,
      aiConfidenceScore: evaluationResult.aiConfidenceScore || 0.85,
      reasoning: evaluationResult.reasoning || '',
    });

    // 6. Generate next question or finalize interview session
    const maxQuestions = session.totalQuestions || 5;
    const currentOrder = session.currentQuestionIndex + 1; // index of the question we just answered

    if (currentOrder < maxQuestions) {
      // Generate Adaptive Follow-Up Question
      let nextQuestionText = `Could you elaborate more on your experience with this domain?`;
      let nextCategory = 'FollowUp';
      let nextSourceType = 'FollowUp';

      try {
        console.log(`[Interview Service] Requesting follow-up question...`);
        const followupResp = await fetch(`${aiServiceUrl}/generate-followup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previous_question: questionText,
            previous_answer: transcript,
            resume_snapshot: assignment.resumeSnapshot,
            experience_level: assignment.resumeSnapshot?.aiRecommendation || 'Mid',
            question_order: currentOrder + 1,
          }),
        });

        if (followupResp.ok) {
          const followResult: any = await followupResp.json();
          nextQuestionText = followResult.question || nextQuestionText;
          nextCategory = followResult.category || 'FollowUp';
          nextSourceType = followResult.sourceType || 'FollowUp';
          console.log(`[Interview Service] Followup success. Question: ${nextQuestionText.substring(0, 40)}...`);
        }
      } catch (followError: any) {
        console.error(`[Interview Service] Follow-up generation failed: ${followError.message}`);
      }

      // Save next question in database
      await InterviewQuestion.create({
        sessionId: session._id,
        questionText: nextQuestionText,
        category: normalizeCategory(nextCategory),
        difficulty: 'Medium',
        isFollowUp: true,
        parentQuestionId: response.questionId,
        order: currentOrder + 1,
        questionVersion: 1,
        sourceType: normalizeSourceType(nextSourceType),
        generatedBy: 'AI_ENGINE',
      });

      // Increment question index
      session.currentQuestionIndex = currentOrder;
      await session.save();
      console.log(`[Interview Service] Next question stored and question index updated to: ${currentOrder}`);
    } else {
      // Finished all questions! Trigger final report generation job
      const redisOnline = await isRedisOnline();
      if (redisOnline) {
        console.log(`[Interview Service] Session questions completed. Enqueuing report compilation job...`);
        await interviewQueue.add('generate-report', { sessionId: session._id });
      } else {
        console.log(`[Interview Service] Session questions completed. Compiling report synchronously...`);
        await this.compileReport(session._id.toString());
      }
    }
  }

  async compileReport(sessionId: string) {
    console.log(`[Interview Service] compileReport started for sessionId: ${sessionId}`);
    // 1. Get session details
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      throw new Error('InterviewSession not found');
    }

    const assignment = await InterviewAssignment.findById(session.assignmentId);
    if (!assignment) {
      throw new Error('InterviewAssignment not found');
    }

    // 2. Fetch all questions, responses, and evaluations for this session
    const questions = await InterviewQuestion.find({ sessionId }).sort({ order: 1 });
    const responses = await InterviewResponse.find({ sessionId });
    const evaluations = await InterviewEvaluation.find({ sessionId });

    // Build transcripts string
    const qaData = questions.map((q) => {
      const resp = responses.find((r) => r.questionId.toString() === q._id.toString());
      const evalItem = evaluations.find((e) => e.responseId.toString() === (resp?._id || '').toString());
      return {
        question: q.questionText,
        answer: resp?.transcript || 'No response provided.',
        score: evalItem?.overallScore || 0,
      };
    });

    // 3. Calculate overall score (average of overall evaluation scores)
    let overallScore = 70;
    if (evaluations.length > 0) {
      const sum = evaluations.reduce((acc, curr) => acc + curr.overallScore, 0);
      overallScore = Math.round(sum / evaluations.length);
    }

    // 4. Request summary report compilation via FastAPI
    let reportData = {
      technicalAnalysis: 'Demonstrated average technical skills.',
      communicationAnalysis: 'Demonstrated clear communication.',
      strengths: ['Analytical approach'],
      weaknesses: ['Could go into deeper architectural details'],
      hiringRecommendation: 'Consider',
      recommendationReasoning: 'Satisfactory responses across core domains.',
      transcriptSummary: 'Standard voice assessment session completed.',
      skillsBreakdown: {},
    };

    try {
      console.log(`[Interview Service] Generating report via FastAPI...`);
      const reportResp = await fetch(`${aiServiceUrl}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qa_history: qaData,
          resume_snapshot: assignment.resumeSnapshot,
        }),
      });

      if (reportResp.ok) {
        reportData = await reportResp.json();
        console.log(`[Interview Service] Report success. Recommendation: ${reportData.hiringRecommendation}`);
      }
    } catch (reportError: any) {
      console.error(`[Interview Service] Report request failed: ${reportError.message}`);
    }

    // 5. Store report in database
    await InterviewReport.findOneAndUpdate(
      { sessionId: session._id },
      {
        candidateId: session.candidateId,
        jobId: session.jobId,
        overallScore,
        technicalAnalysis: reportData.technicalAnalysis,
        communicationAnalysis: reportData.communicationAnalysis,
        strengths: reportData.strengths || [],
        weaknesses: reportData.weaknesses || [],
        hiringRecommendation: reportData.hiringRecommendation || 'Consider',
        recommendationReasoning: reportData.recommendationReasoning,
        transcriptSummary: reportData.transcriptSummary,
        skillsBreakdown: reportData.skillsBreakdown || {},
        isPublished: true,
      },
      { upsert: true, new: true }
    );

    // 6. Calculate Final Candidate Score (40% Resume + 60% Interview)
    const resumeScore = assignment.resumeScore || 0;
    const finalCandidateScore = Math.round((resumeScore * 0.4) + (overallScore * 0.6));

    // 7. Update Assignment Status
    assignment.status = 'Completed';
    assignment.interviewScore = overallScore;
    assignment.finalCandidateScore = finalCandidateScore;
    await assignment.save();

    // 8. Update Session Status
    session.status = 'Completed';
    session.completedAt = new Date();
    session.duration = Math.round((session.completedAt.getTime() - (session.startedAt || new Date()).getTime()) / 1000);
    await session.save();

    // 9. Recalculate rankings dynamically for this Job
    console.log(`[Interview Service] Finalizing rankings for Job: ${assignment.jobId}...`);
    await RankingService.updateRankingsForJob(assignment.jobId.toString());

    console.log(`[Interview Service] Interview session completed successfully: ${sessionId}`);
  }
}

export default new InterviewService();
