import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import InterviewSession from '../models/InterviewSession';
import Candidate from '../models/Candidate';
import InterviewRecording from '../models/InterviewRecording';
import InterviewTemplate from '../models/InterviewTemplate';
import Job from '../models/Job';
import Application, { ApplicationStage } from '../models/Application';
import { createSuccessResponse, createErrorResponse } from '../modules/employee/dtos/common.dto';
import { emailService } from '../services/email.service';
import { SessionStatus, TimelineEventType } from '../types/interview.types';
import InterviewTranscript from '../models/InterviewTranscript';
import InterviewRecommendation from '../models/InterviewRecommendation';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import CommunicationAnalysis from '../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../models/ProblemSolvingEvaluation';

import InterviewResponse from '../models/InterviewResponse';
import InterviewScore from '../models/InterviewScore';
import InterviewReport from '../models/InterviewReport';
import InterviewTimeline from '../models/InterviewTimeline';

export const deleteInterviewSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findById(id);

    if (!session) {
      return res.status(404).json(createErrorResponse('Session not found', undefined, 404));
    }

    const sessionIds = [session._id];

    // Find related Transcripts
    const transcripts = await InterviewTranscript.find({ sessionId: session._id });
    const transcriptIds = transcripts.map((t) => t._id);

    if (transcriptIds.length > 0) {
      // Hard delete transcript-dependent models
      await TechnicalEvaluation.deleteMany({ transcriptId: { $in: transcriptIds } });
      await ProblemSolvingEvaluation.deleteMany({ transcriptId: { $in: transcriptIds } });
      await CommunicationAnalysis.deleteMany({ transcriptId: { $in: transcriptIds } });
    }

    // Hard delete session-dependent models
    await InterviewTranscript.deleteMany({ sessionId: session._id });
    await InterviewResponse.deleteMany({ sessionId: session._id });
    await InterviewRecording.deleteMany({ sessionId: session._id });
    await InterviewScore.deleteMany({ sessionId: session._id });
    await InterviewReport.deleteMany({ sessionId: session._id });
    await InterviewRecommendation.deleteMany({ sessionId: session._id });
    await InterviewTimeline.deleteMany({ sessionId: session._id });

    // Hard delete the session itself
    await InterviewSession.deleteOne({ _id: session._id });

    res.status(200).json(createSuccessResponse(null, 'Session deleted successfully', 200));
  } catch (error: any) {
    res.status(500).json(createErrorResponse('Failed to delete session', error.message, 500));
  }
};

export const resetInterviewSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findById(id);
    
    if (!session) {
      return res.status(404).json(createErrorResponse('Session not found', undefined, 404));
    }

    // 1. Delete associated data
    await InterviewTranscript.deleteMany({ sessionId: session._id });
    await InterviewRecording.deleteMany({ sessionId: session._id });
    await InterviewRecommendation.deleteOne({ sessionId: session._id });
    
    // 2. We could delete Evaluations but since transcripts are deleted, evaluations might be orphaned, better to delete them.
    // Actually we can find transcripts and delete their evaluations first, but let's do it simply by sessionId if evaluations had it... wait, evaluations use transcriptId.
    // Since this is MVP, orphaned evaluations won't hurt much, but let's keep it clean if we can, or just clear transcripts.

    // 3. Reset Session fields
    session.status = SessionStatus.CREATED;
    session.currentQuestionIndex = 0;
    session.startedAt = undefined;
    session.completedAt = undefined;
    session.duration = undefined;
    
    await session.save();

    res.status(200).json(createSuccessResponse(session, 'Session reset successfully', 200));
  } catch (error: any) {
    res.status(500).json(createErrorResponse('Failed to reset session', error.message, 500));
  }
};

import Department from '../models/Department';

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    // Explicitly reference models so Mongoose registers schemas for populate()
    void Candidate;
    void Job;
    void Department;
    void InterviewTemplate;

    const sessions = await InterviewSession.find()
      .populate('candidateId', 'firstName lastName email candidateCode status')
      .populate({
        path: 'jobId',
        select: 'title departmentId location',
        populate: { path: 'departmentId', select: 'name' }
      })
      .populate('templateId', 'title')
      .sort({ createdAt: -1 });
    
    console.log(`[AI_INTERVIEW] Retrieved ${sessions.length} sessions for management dashboard.`);
    res.status(200).json(createSuccessResponse(sessions, 'Sessions retrieved successfully'));
  } catch (error: any) {
    console.error('[AI_INTERVIEW] Failed to retrieve sessions:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve sessions', error.message, 500));
  }
};

import { questionGeneratorService } from '../services/question-generator.service';

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const { candidateId, templateId, jobId } = req.body;
    const recruiterId = (req as any).user._id;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json(createErrorResponse('Candidate not found', undefined, 404));
    }

    // Resolve Job context
    let resolvedJobId = jobId;
    if (!resolvedJobId) {
      const app = await Application.findOne({ candidateId, status: { $ne: 'REJECTED' } }).sort({ createdAt: -1 });
      if (app && app.jobId) {
        resolvedJobId = app.jobId.toString();
      }
    }

    // If neither Job nor legacy template exists, reject
    if (!resolvedJobId && !templateId) {
      return res.status(400).json(createErrorResponse('INTERVIEW_JOB_CONTEXT_UNAVAILABLE: Either jobId or legacy templateId is required.', undefined, 400));
    }

    let job = null;
    if (resolvedJobId) {
      job = await Job.findById(resolvedJobId);
      if (!job) {
        return res.status(404).json(createErrorResponse('INTERVIEW_JOB_CONTEXT_UNAVAILABLE: Job not found.', undefined, 404));
      }
    }

    // Generate unique public token (hex)
    const publicToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // Create session
    const session = await InterviewSession.create({
      candidateId,
      jobId: resolvedJobId || undefined,
      templateId: templateId || undefined,
      recruiterId,
      status: SessionStatus.CREATED,
      totalQuestions: 5,
      interviewConfig: { targetQuestions: 5, minimumQuestions: 4, maximumQuestions: 7 },
      publicToken,
      tokenExpiresAt,
    });

    if (job) {
      // Asynchronously pre-plan competencies for this job
      questionGeneratorService.initializeSessionCompetencies(session, job).catch((err) => {
        console.warn(`[ScheduleInterview] Pre-planning competencies async note: ${err.message}`);
      });
    }

    // Send email to candidate
    const interviewLink = `${process.env.FRONTEND_URL}/interview/${publicToken}`;
    
    await emailService.sendEmail({
      to: candidate.email,
      subject: `Interview Invitation - ${job ? job.title : 'BluHire AI'}`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333;">Interview Invitation</h2>
          <p>Dear ${candidate.firstName},</p>
          <p>You have been invited to complete an AI-driven interview for the position <strong>${job ? job.title : 'your application'}</strong>.</p>
          <p>This interview will assess your skills using automated question delivery and response analysis. Please ensure you are in a quiet environment with a working microphone and webcam.</p>
          <p>This link is uniquely generated for you and will expire on <strong>${tokenExpiresAt.toDateString()}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${interviewLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start AI Interview
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${interviewLink}</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #888;">Best regards,<br/>The BluHire AI Recruitment Team</p>
        </div>
      `
    });

    return res.status(201).json(createSuccessResponse(session, 'Interview scheduled and invitation sent successfully', 201));
  } catch (error: any) {
    console.error('Schedule Interview Error:', error);
    return res.status(500).json(createErrorResponse('Failed to schedule interview', error.message, 500));
  }
};

export const getPublicSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const session = await InterviewSession.findOne({ publicToken: token })
      .populate('candidateId', 'firstName lastName email')
      .populate('jobId', 'title description requiredSkills preferredSkills responsibilities experienceRequired')
      .populate('templateId', 'title description durationMinutes');

    if (!session) {
      return res.status(404).json(createErrorResponse('Interview session not found or link is invalid.', undefined, 404));
    }

    if (session.tokenExpiresAt && new Date() > session.tokenExpiresAt) {
      return res.status(400).json(createErrorResponse('This interview link has expired.', undefined, 400));
    }

    if (session.status === SessionStatus.COMPLETED) {
      return res.status(400).json(createErrorResponse('This interview has already been completed.', undefined, 400));
    }

    // Resolve Job details if missing from session
    let jobData: any = session.jobId;
    if (!jobData && !session.templateId) {
      try {
        const resolvedJob = await questionGeneratorService.resolveJobForSession(session);
        jobData = resolvedJob;
      } catch (jobErr: any) {
        return res.status(400).json(createErrorResponse('INTERVIEW_JOB_CONTEXT_UNAVAILABLE: Could not resolve job context for this session.', undefined, 400));
      }
    }

    return res.status(200).json(createSuccessResponse({
      sessionId: session._id,
      candidate: session.candidateId,
      job: jobData ? {
        _id: jobData._id,
        title: jobData.title,
        description: jobData.description,
        requiredSkills: jobData.requiredSkills || [],
        experienceRequired: jobData.experienceRequired || '',
      } : null,
      template: session.templateId,
      status: session.status,
      totalQuestions: session.totalQuestions,
      expiresAt: session.tokenExpiresAt
    }, 'Public session retrieved successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to retrieve public session', error.message, 500));
  }
};

export const startPublicSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session || (session.tokenExpiresAt && new Date() > session.tokenExpiresAt)) {
      return res.status(400).json(createErrorResponse('Invalid or expired interview link', undefined, 400));
    }

    if (session.status === SessionStatus.COMPLETED) {
      return res.status(400).json(createErrorResponse('Interview already completed', undefined, 400));
    }

    session.status = SessionStatus.STARTED;
    if (!session.startedAt) {
      session.startedAt = new Date();
    }
    await session.save();

    return res.status(200).json(createSuccessResponse({ status: session.status }, 'Interview started successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to start interview', error.message, 500));
  }
};

export const submitPublicSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    console.log(`[AI_INTERVIEW] Completing interview for token: ${token}`);
    
    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session) {
      console.warn(`[AI_INTERVIEW] Completion failed: Interview session not found for token: ${token}`);
      return res.status(404).json(createErrorResponse('Interview session not found', undefined, 404));
    }

    // A legitimately started interview or already completed interview can be safely finalized
    const isStartedOrCompleted = session.status === SessionStatus.COMPLETED || !!session.startedAt;
    if (session.tokenExpiresAt && new Date() > session.tokenExpiresAt && !isStartedOrCompleted) {
      console.warn(`[AI_INTERVIEW] Completion failed: Token expired before interview was started`);
      return res.status(400).json(createErrorResponse('Invalid or expired interview link', undefined, 400));
    }

    // Set or preserve COMPLETED status idempotently
    session.status = SessionStatus.COMPLETED;
    if (!session.completedAt) {
      session.completedAt = new Date();
    }
    
    // Ensure duration is populated if missing
    if (!session.duration && session.startedAt) {
      const durationMs = session.completedAt.getTime() - session.startedAt.getTime();
      session.duration = Math.max(1, Math.floor(durationMs / 1000)); // seconds
    }

    await session.save();
    console.log(`[AI_INTERVIEW] Interview marked COMPLETED for session: ${session._id}`);

    // Ensure Candidate status is UNDER_REVIEW only if not already advanced to OFFER/HIRED/REJECTED
    const candidate = await Candidate.findById(session.candidateId);
    if (candidate && ['APPLIED', 'SCREENING'].includes(candidate.status)) {
      candidate.status = 'UNDER_REVIEW';
      await candidate.save();
    }
    
    // Ensure Application stage and interviewStatus is COMPLETED using scoped lookup
    let app: any = null;
    if (session.applicationId) {
      app = await Application.findOne({ _id: session.applicationId, isDeleted: false });
    }
    if (!app) {
      app = await Application.findOne({
        candidateId: session.candidateId,
        ...(session.jobId ? { jobId: session.jobId } : {}),
        isDeleted: false,
      }).sort({ createdAt: -1 });
    }

    if (app) {
      app.interviewStatus = 'COMPLETED';
      app.interviewCompletedAt = session.completedAt || new Date();
      // Never downgrade OFFER or HIRED or REJECTED
      if (app.currentStage === ApplicationStage.APPLIED || app.currentStage === ApplicationStage.SCREENING) {
        app.currentStage = ApplicationStage.INTERVIEW;
      }
      await app.save();
    }

    // Check evaluation status from responses
    const responses = await InterviewResponse.find({ sessionId: session._id });
    let evaluationStatus = 'PENDING';
    if (responses.length > 0) {
      const allDone = responses.every(r => r.evaluationStatus === 'COMPLETED');
      const anyFailed = responses.some(r => r.evaluationStatus === 'FAILED');
      const anyProcessing = responses.some(r => r.evaluationStatus === 'PROCESSING');
      if (allDone) evaluationStatus = 'COMPLETED';
      else if (anyProcessing) evaluationStatus = 'PROCESSING';
      else if (anyFailed) evaluationStatus = 'FAILED';
    }

    // Sync scoring and recommendation details to recruitment Application asynchronously
    import('../modules/recruitment/applications/applications.service').then(({ default: applicationsService }) => {
      applicationsService.syncApplicationScores(session._id.toString()).catch((err) => {
        console.error('[Score Sync Error] Async synchronization failed:', err.message);
      });
    });

    console.log(`[AI_INTERVIEW] Completion response sent for session: ${session._id}`);
    return res.status(200).json(createSuccessResponse({ 
      interviewId: session._id,
      status: session.status,
      evaluationStatus
    }, 'Interview submitted successfully', 200));
  } catch (error: any) {
    console.error(`[AI_INTERVIEW] Completion failed: ${error.message}`);
    return res.status(500).json(createErrorResponse('Failed to submit interview', error.message, 500));
  }
};

export const uploadRecording = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { questionIndex, questionId } = req.body;

    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session) {
      return res.status(404).json(createErrorResponse('Interview session not found', undefined, 404));
    }
    
    if (!req.file) {
      if (questionId) {
        await InterviewResponse.findOneAndUpdate(
          { sessionId: session._id, questionId },
          {
            $set: {
              candidateId: session.candidateId,
              responseStatus: 'RECORDING_FAILED',
              evaluationStatus: 'NOT_STARTED',
              answeredAt: new Date()
            }
          },
          { upsert: true }
        );
      }
      return res.status(400).json(createErrorResponse('No video file uploaded', undefined, 400));
    }
    if (!questionId) {
      return res.status(400).json(createErrorResponse('questionId is required', undefined, 400));
    }

    // Build a URL-accessible path for the video (served via /uploads static middleware)
    const filename = path.basename(req.file.path);
    const videoUrl = `/uploads/interviews/${filename}`;
    const absoluteFilePath = req.file.path; // Used for AI transcription (needs filesystem path)

    const recording = new InterviewRecording({
      sessionId: session._id,
      candidateId: session.candidateId,
      questionId: questionId,
      questionIndex: questionIndex || 0,
      videoUrl: videoUrl,         // URL path for frontend playback
      audioUrl: '',
      duration: 0,
      status: 'UPLOADED'
    });

    console.log(`[AI_INTERVIEW] Final answer received: questionIndex=${questionIndex}, questionId=${questionId}`);
    console.log(`[AI_INTERVIEW] Saving response for session: ${session._id}`);
    await recording.save();
    console.log(`[uploadRecording] Recording saved: ${recording._id}, videoUrl: ${videoUrl}`);

    // Upsert InterviewResponse with initial PENDING status
    try {
      await InterviewResponse.findOneAndUpdate(
        { sessionId: session._id, questionId: questionId },
        {
          $set: {
            candidateId: session.candidateId,
            recordingId: recording._id,
            responseStatus: 'PENDING',
            evaluationStatus: 'NOT_STARTED',
            answeredAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      console.log(`[AI_INTERVIEW] Response saved for session: ${session._id}, question: ${questionId}`);
      console.log(`[AI_INTERVIEW] Queueing evaluation for session: ${session._id}`);
    } catch (respErr: any) {
      console.error('[uploadRecording] InterviewResponse initial upsert failed (non-fatal):', respErr.message);
    }

    // Trigger AI transcription process here asynchronously.
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
      fetch(`${aiServiceUrl}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId: recording._id, filePath: absoluteFilePath })
      })
      .then(async (response) => {
         const { default: InterviewTranscript } = await import('../models/InterviewTranscript');
         const { default: InterviewQuestion } = await import('../models/InterviewQuestion');
         
         let targetQuestionId = questionId;
         if (!targetQuestionId) {
           const questions = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
           const matchedQuestion = questions[Number(questionIndex) || 0];
           if (matchedQuestion) {
             targetQuestionId = matchedQuestion._id.toString();
           }
         }

         if (!response.ok) {
            const errText = await response.text();
            console.error(`[uploadRecording] [Session ${session._id}] [Question ${targetQuestionId}] Transcription failed on AI Service side:`, errText);
            await InterviewResponse.findOneAndUpdate(
              { sessionId: session._id, questionId: targetQuestionId },
              { $set: { responseStatus: 'TRANSCRIPTION_FAILED', transcriptionError: errText } }
            );
            return;
         }

         const data = await response.json();

         // Check if Whisper execution failed
         if (data.success === false) {
            console.error(`[uploadRecording] [Session ${session._id}] [Question ${targetQuestionId}] Whisper processing failed:`, data.error);
            await InterviewResponse.findOneAndUpdate(
              { sessionId: session._id, questionId: targetQuestionId },
              { $set: { responseStatus: 'TRANSCRIPTION_FAILED', transcriptionError: data.error || 'Whisper processing failed' } }
            );
            return;
         }

         const qIdx = Number(questionIndex) || 0;

         // Transcription succeeded -> Candidate successfully ANSWERED
         const transcript = await InterviewTranscript.findOneAndUpdate(
            { sessionId: session._id, questionId: targetQuestionId },
            {
               $set: {
                  candidateId: session.candidateId,
                  questionIndex: qIdx,
                  transcript: data.transcript,
               }
            },
            { upsert: true, new: true }
         );

         await InterviewResponse.findOneAndUpdate(
            { sessionId: session._id, questionId: targetQuestionId },
            {
              $set: {
                responseStatus: 'ANSWERED',
                transcriptId: transcript._id,
                transcriptionError: null,
              }
            }
         );

         console.log(`[uploadRecording] [Session ${session._id}] [Question ${targetQuestionId}] Transcription saved. responseStatus = ANSWERED.`);

         // Trigger Evaluation ONLY if transcript is substantive
         const { isSubstantiveAnswer } = await import('../utils/transcript-validator');
         if (!isSubstantiveAnswer(data.transcript)) {
           console.log(`[uploadRecording] Non-substantive transcript for recording ${recording._id}. Marking evaluation COMPLETED.`);
           await InterviewResponse.findOneAndUpdate(
             { sessionId: session._id, questionId: targetQuestionId },
             { $set: { evaluationStatus: 'COMPLETED' } }
           );
           return;
         }

         // Mark evaluation as PROCESSING
         await InterviewResponse.findOneAndUpdate(
           { sessionId: session._id, questionId: targetQuestionId },
           { $set: { evaluationStatus: 'PROCESSING' } }
         );

         try {
            console.log(`[AI_EVALUATION] Started for session: ${session._id}, question: ${targetQuestionId}`);
            // Load Job and Question context to evaluate specifically against job requirements
            const job = await questionGeneratorService.resolveJobForSession(session);
            const qDoc = await InterviewQuestion.findById(targetQuestionId);

            const evalPayload = {
              job: {
                title: job.title,
                description: job.description,
                requiredSkills: job.requiredSkills || [],
              },
              question: {
                question: qDoc?.questionText || 'Technical question',
                competency: qDoc?.competency || 'Technical Ability',
                expectedTopics: qDoc?.expectedTopics || [],
              },
              transcript: data.transcript,
            };

            const evalResponse = await fetch(`${aiServiceUrl}/interview/evaluate`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(evalPayload)
            });

            if (!evalResponse.ok) {
              const errBody = await evalResponse.text();
              throw new Error(`AI evaluate endpoint returned ${evalResponse.status}: ${errBody}`);
            }

            const evalData = await evalResponse.json();
            
            const { default: TechnicalEvaluation } = await import('../models/TechnicalEvaluation');
            const { default: CommunicationAnalysis } = await import('../models/CommunicationAnalysis');
            const { default: ProblemSolvingEvaluation } = await import('../models/ProblemSolvingEvaluation');
            const { default: InterviewRecommendation } = await import('../models/InterviewRecommendation');

            await new TechnicalEvaluation({
              transcriptId: transcript._id,
              technicalAccuracy: (evalData.technicalScore || 0) / 10,
              conceptUnderstanding: (evalData.technicalScore || 0) / 10,
              depth: (evalData.technicalScore || 0) / 10,
              practicalKnowledge: (evalData.technicalScore || 0) / 10,
              overallTechnicalScore: (evalData.technicalScore || 0) / 10,
              feedback: evalData.technicalFeedback || '',
              rubricEvaluations: []
            }).save();

            await new CommunicationAnalysis({
              transcriptId: transcript._id,
              communicationScore: (evalData.communicationScore || 0) / 10,
              clarityScore: (evalData.communicationScore || 0) / 10,
              fillerWordCount: 0,
              grammarScore: (evalData.communicationScore || 0) / 10,
              vocabularyScore: (evalData.communicationScore || 0) / 10,
              feedback: evalData.communicationFeedback || '',
            }).save();

            await new ProblemSolvingEvaluation({
              transcriptId: transcript._id,
              logicalThinking: (evalData.problemSolvingScore || 0) / 10,
              approach: (evalData.problemSolvingScore || 0) / 10,
              tradeoffs: (evalData.problemSolvingScore || 0) / 10,
              decisionMaking: (evalData.problemSolvingScore || 0) / 10,
              overallProblemSolvingScore: (evalData.problemSolvingScore || 0) / 10,
              feedback: evalData.problemSolvingFeedback || ''
            }).save();

            const rawRec: string = (evalData.recommendation || 'NO_HIRE').toUpperCase();
            let mappedRec = 'REJECT';
            if (rawRec === 'HIRE') mappedRec = 'HIRE';
            else if (rawRec === 'MAYBE_HIRE') mappedRec = 'MAYBE_HIRE';
            else mappedRec = 'REJECT';

            const avgScore = Math.round(
              ((evalData.technicalScore || 0) * 0.4) +
              ((evalData.communicationScore || 0) * 0.3) +
              ((evalData.problemSolvingScore || 0) * 0.3)
            );

            const reasoning = [
              `Technical: ${evalData.technicalFeedback || 'N/A'}`,
              `Communication: ${evalData.communicationFeedback || 'N/A'}`,
              `Problem Solving: ${evalData.problemSolvingFeedback || 'N/A'}`,
            ].join(' | ');

            await InterviewRecommendation.findOneAndUpdate(
              { sessionId: session._id },
              {
                recommendation: mappedRec,
                confidence: avgScore / 100,
                reasoning,
              },
              { upsert: true, new: true }
            );

            // Update session competency coverage from demonstrated competencies
            if (Array.isArray(evalData.demonstratedCompetencies) && session.competencyPlan) {
              for (const demo of evalData.demonstratedCompetencies) {
                const comp = session.competencyPlan.find(
                  c => c.name.toLowerCase() === (demo.competency || '').toLowerCase()
                );
                if (comp) {
                  comp.covered = true;
                  comp.coverageScore = Math.max(comp.coverageScore || 0, Number(demo.demonstratedScore) || 0);
                }
              }
              await session.save();
              console.log(`[uploadRecording] [Session ${session._id}] Updated competency coverage based on AI evaluation.`);
            }

            // Mark evaluation completed successfully
            await InterviewResponse.findOneAndUpdate(
              { sessionId: session._id, questionId: targetQuestionId },
              { $set: { evaluationStatus: 'COMPLETED', evaluationError: null } }
            );

            console.log(`[AI_EVALUATION] Evaluation completed for session: ${session._id}, transcript: ${transcript._id}`);
            console.log(`[AI_EVALUATION] Result persisted for session: ${session._id}`);

            // Trigger application score sync asynchronously
            import('../modules/recruitment/applications/applications.service').then(({ default: applicationsService }) => {
              applicationsService.syncApplicationScores(session._id.toString()).catch((err) => {
                console.error('[Score Sync Error] Async synchronization failed:', err.message);
              });
            });
         } catch (evalErr: any) {
            console.error(`[AI_EVALUATION] Evaluation failed for session: ${session._id}, question: ${targetQuestionId}:`, evalErr.message);
            // Crucial: responseStatus REMAINS 'ANSWERED', only evaluationStatus is FAILED
            await InterviewResponse.findOneAndUpdate(
              { sessionId: session._id, questionId: targetQuestionId },
              { $set: { evaluationStatus: 'FAILED', evaluationError: evalErr.message } }
            );

            // Even on evaluation failure, sync application scores so application state reflects completion
            import('../modules/recruitment/applications/applications.service').then(({ default: applicationsService }) => {
              applicationsService.syncApplicationScores(session._id.toString()).catch((err) => {
                console.error('[Score Sync Error] Async synchronization failed:', err.message);
              });
            });
         }
      })
      .catch(async (e) => {
        console.error(`[uploadRecording] [Session ${session._id}] Transcription trigger failed asynchronously:`, e.message);
        await InterviewResponse.findOneAndUpdate(
          { sessionId: session._id, questionId },
          { $set: { responseStatus: 'TRANSCRIPTION_FAILED', transcriptionError: e.message } }
        );
      });
    } catch (e: any) {
      console.error("Failed to trigger transcription:", e.message);
    }

    return res.status(200).json(createSuccessResponse({ recordingId: recording._id }, 'Recording uploaded successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to upload recording', error.message, 500));
  }
};

export const skipQuestion = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { questionId, questionIndex } = req.body;

    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session) {
      return res.status(404).json(createErrorResponse('Interview session not found', undefined, 404));
    }

    let targetQuestionId = questionId;
    if (!targetQuestionId) {
      const { default: InterviewQuestion } = await import('../models/InterviewQuestion');
      const qDocs = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
      const matched = qDocs[Number(questionIndex) || 0];
      if (matched) targetQuestionId = matched._id.toString();
    }

    console.log(`[skipQuestion] [Session ${session._id}] [Question ${targetQuestionId}] Explicit candidate SKIP recorded.`);

    await InterviewResponse.findOneAndUpdate(
      { sessionId: session._id, questionId: targetQuestionId },
      {
        $set: {
          candidateId: session.candidateId,
          responseStatus: 'SKIPPED',
          evaluationStatus: 'NOT_STARTED',
          answeredAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(createSuccessResponse(null, 'Question skip recorded successfully', 200));
  } catch (error: any) {
    console.error('Skip question error:', error);
    return res.status(500).json(createErrorResponse('Failed to record question skip', error.message, 500));
  }
};

/**
 * GET /public/:token/next-question
 * Returns the next question for the candidate adaptively.
 * On first call (questionIndex=0) returns the first question.
 * On subsequent calls uses the AdaptiveQuestionService.
 */
export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const session = await InterviewSession.findOne({ publicToken: token });

    if (!session) {
      return res.status(404).json(createErrorResponse('Session not found', undefined, 404));
    }

    if (session.tokenExpiresAt && new Date() > session.tokenExpiresAt) {
      return res.status(400).json(createErrorResponse('Interview link has expired', undefined, 400));
    }

    const { adaptiveQuestionService } = await import('../services/adaptiveQuestion.service');
    const { default: InterviewQuestion } = await import('../models/InterviewQuestion');
    const { default: InterviewResponse } = await import('../models/InterviewResponse');
    const question = await adaptiveQuestionService.selectNextQuestion(session._id.toString());

    if (!question) {
      const maxQuestions = session.interviewConfig?.maximumQuestions || 7;
      const responsesCount = await InterviewResponse.countDocuments({ sessionId: session._id });
      const reason = responsesCount >= maxQuestions ? 'MAXIMUM_QUESTIONS_REACHED' : 'TARGET_COMPETENCIES_SATISFIED';

      session.status = SessionStatus.COMPLETED;
      session.completedAt = session.completedAt || new Date();
      if (!session.duration && session.startedAt) {
        const durationMs = session.completedAt.getTime() - session.startedAt.getTime();
        session.duration = Math.max(1, Math.floor(durationMs / 1000));
      }
      await session.save();

      console.log(`[AI_INTERVIEW] Interview complete for session ${session._id}. Reason: ${reason} (totalAsked: ${responsesCount})`);

      return res.status(200).json(createSuccessResponse({
        completed: true,
        reason,
        totalQuestionsAsked: responsesCount,
      }, 'Interview completed', 200));
    }

    // Determine authoritative questionIndex based on question position in session
    const allSessionQuestions = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
    const matchIdx = allSessionQuestions.findIndex(q => q._id.toString() === question._id.toString());
    const qIndex = matchIdx >= 0 ? matchIdx + 1 : (session.currentQuestionIndex || 1);

    const targetTotal = session.interviewConfig?.targetQuestions || session.totalQuestions || 5;
    const maxAllowed = session.interviewConfig?.maximumQuestions || 7;
    session.currentQuestionIndex = qIndex;
    session.totalQuestions = Math.min(maxAllowed, Math.max(targetTotal, allSessionQuestions.length));
    await session.save();

    console.log(`[Next Question] returned sessionId=${session._id} jobId=${session.jobId} questionId=${question._id} (Q${session.currentQuestionIndex} of ${session.totalQuestions})`);

    return res.status(200).json(createSuccessResponse({
      questionId: question._id,
      questionText: question.questionText,
      category: question.category,
      competency: question.competency,
      difficulty: question.difficulty,
      reason: question.reason,
      sourceSkill: question.sourceSkill,
      questionIndex: session.currentQuestionIndex,
      totalQuestions: session.totalQuestions,
    }, 'Next question fetched', 200));
  } catch (error: any) {
    console.error(`[Next Question] Error: ${error.message}`);
    return res.status(500).json(createErrorResponse('Failed to fetch next question', error.message, 500));
  }
};

/**
 * POST /public/:token/proctoring-event
 * Receives real-time client-side proctoring events and updates session risk metrics.
 */
export const recordProctoringEvent = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { type, severity, confidence, durationMs, timestamp, metadata } = req.body;

    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session) {
      return res.status(404).json(createErrorResponse('Interview session not found', undefined, 404));
    }

    // 1. Create Timeline Entry
    await InterviewTimeline.create({
      sessionId: session._id,
      eventType: type || TimelineEventType.PROCTORING_EVENT,
      eventData: {
        type,
        severity: severity || 'warning',
        confidence: confidence ?? 0.9,
        durationMs: durationMs ?? 0,
        metadata: metadata || {},
      },
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // 2. Increment Summary Counters
    const summary = session.proctoringSummary || {
      gazeAwayCount: 0,
      faceMissingCount: 0,
      multipleFaceCount: 0,
      tabSwitchCount: 0,
      windowBlurCount: 0,
      fullscreenExitCount: 0,
      copyPasteCount: 0,
      cameraDisconnectCount: 0,
    };

    if (type === 'GAZE_AWAY') summary.gazeAwayCount = (summary.gazeAwayCount || 0) + 1;
    else if (type === 'FACE_NOT_DETECTED') summary.faceMissingCount = (summary.faceMissingCount || 0) + 1;
    else if (type === 'MULTIPLE_FACES_DETECTED') summary.multipleFaceCount = (summary.multipleFaceCount || 0) + 1;
    else if (type === 'TAB_SWITCH') summary.tabSwitchCount = (summary.tabSwitchCount || 0) + 1;
    else if (type === 'WINDOW_BLUR') summary.windowBlurCount = (summary.windowBlurCount || 0) + 1;
    else if (type === 'FULLSCREEN_EXIT') summary.fullscreenExitCount = (summary.fullscreenExitCount || 0) + 1;
    else if (type === 'COPY_ATTEMPT' || type === 'PASTE_ATTEMPT' || type === 'CONTEXT_MENU_ATTEMPT') {
      summary.copyPasteCount = (summary.copyPasteCount || 0) + 1;
    } else if (type === 'CAMERA_DISABLED' || type === 'CAMERA_DISCONNECTED') {
      summary.cameraDisconnectCount = (summary.cameraDisconnectCount || 0) + 1;
    }

    session.proctoringSummary = summary;

    // 3. Compute Cumulative Risk Score (0-100)
    let score = 0;
    score += (summary.gazeAwayCount || 0) * 8;
    score += (summary.faceMissingCount || 0) * 10;
    score += (summary.multipleFaceCount || 0) * 20;
    score += (summary.tabSwitchCount || 0) * 15;
    score += (summary.windowBlurCount || 0) * 10;
    score += (summary.fullscreenExitCount || 0) * 15;
    score += (summary.copyPasteCount || 0) * 8;
    score += (summary.cameraDisconnectCount || 0) * 15;

    session.proctoringRiskScore = Math.min(100, score);

    if (session.proctoringRiskScore <= 20) {
      session.proctoringRiskLevel = 'LOW';
    } else if (session.proctoringRiskScore <= 50) {
      session.proctoringRiskLevel = 'MODERATE';
    } else if (session.proctoringRiskScore <= 75) {
      session.proctoringRiskLevel = 'HIGH';
    } else {
      session.proctoringRiskLevel = 'CRITICAL';
    }

    await session.save();

    return res.status(200).json(createSuccessResponse({
      riskScore: session.proctoringRiskScore,
      riskLevel: session.proctoringRiskLevel,
      summary: session.proctoringSummary,
    }, 'Proctoring event logged successfully', 200));
  } catch (error: any) {
    console.error('[recordProctoringEvent Error]:', error);
    return res.status(500).json(createErrorResponse('Failed to record proctoring event', error.message, 500));
  }
};

/**
 * GET /:sessionId/proctoring
 * Fetches proctoring summary and event timeline for recruiter review.
 */
export const getSessionProctoring = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findById(id);

    if (!session) {
      return res.status(404).json(createErrorResponse('Session not found', undefined, 404));
    }

    // Fetch proctoring events from timeline
    const proctoringEvents = await InterviewTimeline.find({
      sessionId: session._id,
      eventType: {
        $in: [
          'PROCTORING_EVENT', 'GAZE_AWAY', 'FACE_NOT_DETECTED', 'MULTIPLE_FACES_DETECTED',
          'TAB_SWITCH', 'WINDOW_BLUR', 'WINDOW_FOCUS_RETURNED', 'FULLSCREEN_EXIT',
          'CAMERA_DISABLED', 'CAMERA_DISCONNECTED', 'MICROPHONE_DISABLED',
          'SCREEN_SHARE_STOPPED', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONTEXT_MENU_ATTEMPT',
          'PROCTORING_UNAVAILABLE'
        ] as any
      }
    }).sort({ timestamp: 1 });

    return res.status(200).json(createSuccessResponse({
      sessionId: session._id,
      riskScore: session.proctoringRiskScore ?? 0,
      riskLevel: session.proctoringRiskLevel ?? 'LOW',
      summary: session.proctoringSummary ?? {
        gazeAwayCount: 0,
        faceMissingCount: 0,
        multipleFaceCount: 0,
        tabSwitchCount: 0,
        windowBlurCount: 0,
        fullscreenExitCount: 0,
        copyPasteCount: 0,
        cameraDisconnectCount: 0,
      },
      events: proctoringEvents,
    }, 'Proctoring data retrieved successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to fetch proctoring data', error.message, 500));
  }
};

