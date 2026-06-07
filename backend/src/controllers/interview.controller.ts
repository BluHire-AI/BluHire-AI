import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import InterviewSession from '../models/InterviewSession';
import Candidate from '../models/Candidate';
import InterviewRecording from '../models/InterviewRecording';
import InterviewTemplate from '../models/InterviewTemplate';
import Application, { ApplicationStage } from '../models/Application';
import { createSuccessResponse, createErrorResponse } from '../modules/employee/dtos/common.dto';
import { emailService } from '../services/email.service';
import { SessionStatus } from '../types/interview.types';
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

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await InterviewSession.find()
      .populate('candidateId', 'firstName lastName email candidateCode status')
      .populate('templateId', 'title')
      .sort({ createdAt: -1 });
    
    res.status(200).json(createSuccessResponse(sessions, 'Sessions retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(createErrorResponse('Failed to retrieve sessions', error.message, 500));
  }
};

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const { candidateId, templateId } = req.body;
    const recruiterId = (req as any).user._id;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json(createErrorResponse('Candidate not found', undefined, 404));
    }

    const template = await InterviewTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json(createErrorResponse('Interview template not found', undefined, 404));
    }

    // Generate unique public token (hex)
    const publicToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // Create session
    const session = await InterviewSession.create({
      candidateId,
      templateId,
      recruiterId,
      status: SessionStatus.CREATED,
      totalQuestions: template.questionCount || 0,
      publicToken,
      tokenExpiresAt,
    });

    // Send email to candidate
    const interviewLink = `${process.env.FRONTEND_URL}/interview/${publicToken}`;
    
    await emailService.sendEmail({
      to: candidate.email,
      subject: 'Interview Invitation - BluHire AI',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333;">Interview Invitation</h2>
          <p>Dear ${candidate.firstName},</p>
          <p>You have been invited to complete an AI-driven interview for your recent job application.</p>
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

    return res.status(200).json(createSuccessResponse({
      sessionId: session._id,
      candidate: session.candidateId,
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
    
    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session || (session.tokenExpiresAt && new Date() > session.tokenExpiresAt)) {
      return res.status(400).json(createErrorResponse('Invalid or expired interview link', undefined, 400));
    }

    if (session.status === SessionStatus.COMPLETED) {
      return res.status(400).json(createErrorResponse('Interview already completed', undefined, 400));
    }

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    
    if (session.startedAt) {
      const durationMs = session.completedAt.getTime() - session.startedAt.getTime();
      session.duration = Math.floor(durationMs / 1000); // seconds
    }

    await session.save();

    // Trigger AI Evaluation processes here asynchronously.
    // For now, we update the Candidate status.
    await Candidate.findByIdAndUpdate(session.candidateId, { status: 'UNDER_REVIEW' });
    
    // Also update the Application stage correctly
    await Application.findOneAndUpdate(
      { candidateId: session.candidateId, status: 'ACTIVE', currentStage: ApplicationStage.INTERVIEW },
      { 
        currentStage: ApplicationStage.INTERVIEW, 
        interviewStatus: 'COMPLETED',
        interviewCompletedAt: new Date()
      }
    );

    // Note: In production, we'd emit an event or queue a job to process transcript -> report -> recommendation

    return res.status(200).json(createSuccessResponse({ status: session.status }, 'Interview submitted successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to submit interview', error.message, 500));
  }
};

export const uploadRecording = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { questionIndex, questionId } = req.body;
    
    if (!req.file) {
      return res.status(400).json(createErrorResponse('No video file uploaded', undefined, 400));
    }
    if (!questionId) {
      return res.status(400).json(createErrorResponse('questionId is required', undefined, 400));
    }

    const session = await InterviewSession.findOne({ publicToken: token });
    if (!session) {
      return res.status(404).json(createErrorResponse('Interview session not found', undefined, 404));
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

    await recording.save();
    console.log(`[uploadRecording] Recording saved: ${recording._id}, videoUrl: ${videoUrl}`);

    // Upsert InterviewResponse — avoids duplicate key error on retries
    try {
      await InterviewResponse.findOneAndUpdate(
        { sessionId: session._id, questionId: questionId },
        {
          $set: {
            candidateId: session.candidateId,
            recordingId: recording._id,
            responseStatus: 'COMPLETED',
            answeredAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      console.log(`[uploadRecording] InterviewResponse upserted for question ${questionId}`);
    } catch (respErr: any) {
      // Non-fatal — log and continue so the upload still succeeds
      console.error('[uploadRecording] InterviewResponse upsert failed (non-fatal):', respErr.message);
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
         if (!response.ok) {
            console.error("Transcription failed on AI Service side", await response.text());
            return;
         }
         const data = await response.json();
         // Import InterviewTranscript and InterviewQuestion
         const { default: InterviewTranscript } = await import('../models/InterviewTranscript');
         const { default: InterviewQuestion } = await import('../models/InterviewQuestion');
         
         const questions = await InterviewQuestion.find({ templateId: session.templateId }).sort({ createdAt: 1 });
         const matchedQuestion = questions[questionIndex || 0];

         const transcript = new InterviewTranscript({
            sessionId: session._id,
            candidateId: session.candidateId,
            questionId: matchedQuestion ? matchedQuestion._id : new mongoose.Types.ObjectId(),
            transcript: data.transcript,
         });
         await transcript.save();
         console.log("Transcription saved successfully for recording", recording._id);

         // Phase 4: Trigger Evaluation
         try {
            const evalResponse = await fetch(`${aiServiceUrl}/evaluate`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ transcript: data.transcript })
            });
            if (evalResponse.ok) {
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

               // Map AI output to schema enum: HIRE → HIRE, NO_HIRE → REJECT, MAYBE_HIRE → MAYBE_HIRE
               const rawRec: string = (evalData.recommendation || 'NO_HIRE').toUpperCase();
               let mappedRec = 'REJECT';
               if (rawRec === 'HIRE') mappedRec = 'HIRE';
               else if (rawRec === 'MAYBE_HIRE') mappedRec = 'MAYBE_HIRE';
               else mappedRec = 'REJECT'; // NO_HIRE → REJECT

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

               // Upsert recommendation (last question overrides)
               await InterviewRecommendation.findOneAndUpdate(
                 { sessionId: session._id },
                 {
                   recommendation: mappedRec,
                   confidence: avgScore / 100,
                   reasoning,
                 },
                 { upsert: true, new: true }
               );
               console.log("Evaluation completed for transcript", transcript._id);
            }
         } catch (evalErr) {
            console.error("Evaluation failed:", evalErr);
         }
      })
      .catch(e => console.error("Transcription trigger failed asynchronously:", e.message));
    } catch (e) {
      console.error("Failed to trigger transcription:", e);
    }

    return res.status(200).json(createSuccessResponse({ recordingId: recording._id }, 'Recording uploaded successfully', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to upload recording', error.message, 500));
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
    const question = await adaptiveQuestionService.selectNextQuestion(session._id.toString());

    if (!question) {
      return res.status(200).json(createSuccessResponse(null, 'No more questions available', 200));
    }

    // Advance session question index
    session.currentQuestionIndex = (session.currentQuestionIndex || 0) + 1;
    await session.save();

    return res.status(200).json(createSuccessResponse({
      questionId: question._id,
      questionText: question.questionText,
      category: question.category,
      difficulty: question.difficulty,
      questionIndex: session.currentQuestionIndex,
      totalQuestions: session.totalQuestions,
    }, 'Next question fetched', 200));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse('Failed to fetch next question', error.message, 500));
  }
};
