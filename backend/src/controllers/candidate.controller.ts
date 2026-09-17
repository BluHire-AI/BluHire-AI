import { Request, Response } from 'express';
import InterviewSession from '../models/InterviewSession';
import InterviewReport from '../models/InterviewReport';
import InterviewScore from '../models/InterviewScore';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import CommunicationAnalysis from '../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../models/ProblemSolvingEvaluation';
import InterviewTranscript from '../models/InterviewTranscript';
import InterviewRecording from '../models/InterviewRecording';
import InterviewRecommendation from '../models/InterviewRecommendation';
import { isSubstantiveAnswer, calculateAnswerStats } from '../utils/transcript-validator';

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const sessions = await InterviewSession.find()
      .populate('candidateId', 'firstName lastName email status')
      .populate('templateId', 'title')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('candidateId')
      .populate('templateId');
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // Wrap the response so frontend that expected candidateStatus gets equivalent structure
    res.status(200).json({ success: true, data: { sessionId: session, candidateId: session.candidateId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateReport = async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const report = await InterviewReport.findOne({ sessionId });
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateScorecard = async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const session = await InterviewSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // Compute answer stats using substantive transcripts helper
    const transcripts = await InterviewTranscript.find({ sessionId });
    const answerStats = calculateAnswerStats(session.totalQuestions, transcripts);
    const { totalQuestions, answeredCount, skippedCount, completenessScore, hasSubstantiveAnswers } = answerStats;

    // Handle zero substantive answers (completed or in-progress with 0 answers)
    if (!hasSubstantiveAnswers) {
      const reasoning = "Candidate completed the interview session but provided no substantive responses. All interview questions were skipped, so technical, communication, and problem-solving ability could not be evaluated.";
      return res.status(200).json({
        success: true,
        data: {
          technicalScore: null,
          communicationScore: null,
          problemSolvingScore: null,
          completenessScore: 0,
          overallScore: null,
          recommendation: 'INSUFFICIENT_EVIDENCE',
          reasonCode: 'NO_SUBSTANTIVE_RESPONSES',
          confidence: 0,
          reasoning,
          answeredCount: 0,
          skippedCount: totalQuestions,
          totalQuestions,
          answerCompleteness: 0,
          evaluationStatus: 'INSUFFICIENT_EVIDENCE',
        }
      });
    }

    // Filter substantive transcripts only
    const substantiveTranscripts = transcripts.filter(t => isSubstantiveAnswer(t.transcript));
    const transcriptIds = substantiveTranscripts.map(t => t._id);

    // Step 2: Fetch evaluations scoped to these substantive transcript IDs
    const techEvals = await TechnicalEvaluation.find({ transcriptId: { $in: transcriptIds } });
    const commEvals = await CommunicationAnalysis.find({ transcriptId: { $in: transcriptIds } });
    const probEvals = await ProblemSolvingEvaluation.find({ transcriptId: { $in: transcriptIds } });

    const avg = (arr: any[], field: string) =>
      arr.length > 0 ? arr.reduce((s, e) => s + (e[field] || 0), 0) / arr.length : 0;

    const avgTech = avg(techEvals, 'overallTechnicalScore');
    const avgComm = avg(commEvals, 'communicationScore');
    const avgProb = avg(probEvals, 'overallProblemSolvingScore');

    const technicalScore = Math.round(avgTech * 10);
    const communicationScore = Math.round(avgComm * 10);
    const problemSolvingScore = Math.round(avgProb * 10);

    const overallScore = Math.round(
      (technicalScore * 0.40) +
      (communicationScore * 0.30) +
      (problemSolvingScore * 0.30)
    );

    const rec = await InterviewRecommendation.findOne({ sessionId });

    res.status(200).json({
      success: true,
      data: {
        technicalScore,
        communicationScore,
        problemSolvingScore,
        completenessScore,
        overallScore,
        recommendation: rec?.recommendation ?? null,
        confidence: rec?.confidence ?? null,
        reasoning: rec?.reasoning ?? null,
        answeredCount,
        skippedCount,
        totalQuestions,
        answerCompleteness: completenessScore,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

import applicationsService from '../modules/recruitment/applications/applications.service';
import Application from '../models/Application';

export const updateCandidateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const sessionId = req.params.id;
    const userId = (req as any).user?._id;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Find the latest active application for this candidate
    const app = await Application.findOne({ candidateId: session.candidateId, isDeleted: false }).sort({ createdAt: -1 });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found for candidate' });
    }

    // Call applicationsService.moveStage which handles Candidate status sync, analytics, and employee creation
    const updatedApp = await applicationsService.moveStage(app._id.toString(), status, userId, 'Status updated from AI Interview Review');
    
    res.status(200).json({ success: true, data: updatedApp });
  } catch (error: any) {
    console.error('updateCandidateStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getRankings = async (req: Request, res: Response) => {
  try {
    const rankings = await InterviewRecommendation.aggregate([
      { $sort: { confidence: -1 } },
      {
        $lookup: {
          from: 'interviewsessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $unwind: { path: '$session', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'session.candidateId',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: '$candidate._id',
          firstName: '$candidate.firstName',
          lastName: '$candidate.lastName',
          email: '$candidate.email',
          candidateCode: '$candidate.candidateCode',
          overallScore: { $round: [{ $multiply: ['$confidence', 100] }, 0] },
          recommendation: '$recommendation',
          status: '$candidate.status',
          completedAt: '$session.completedAt',
          sessionId: '$session._id'
        }
      }
    ]);

    res.status(200).json({ success: true, data: rankings });
  } catch (error) {
    console.error('getRankings error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const compareCandidates = async (req: Request, res: Response) => {
  try {
    const ids = req.query.ids as string;
    if (!ids) {
      return res.status(400).json({ success: false, message: 'Provide session ids to compare' });
    }
    const idArray = ids.split(',');
    
    // idArray actually contains session IDs since the UI was passing CandidateApplicationStatus IDs, 
    // now we pass session IDs to compare
    const sessions = await InterviewSession.find({ _id: { $in: idArray } })
      .populate('candidateId', 'firstName lastName');
      
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

import { getQuestionReviewsBySession } from '../services/question-review.service';

export const getCandidateMedia = async (req: Request, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reviewData = await getQuestionReviewsBySession(sessionId as string);
    
    const transcripts = await InterviewTranscript.find({ sessionId });
    const recordings = await InterviewRecording.find({ sessionId });

    res.status(200).json({ 
      success: true, 
      data: { 
        transcripts, 
        recordings,
        questionReviews: reviewData?.questions || [],
        totalQuestions: reviewData?.totalQuestions || 0,
        answeredCount: reviewData?.answeredCount || 0,
        skippedCount: reviewData?.skippedCount || 0,
        completenessScore: reviewData?.completenessScore || 0
      } 
    });
  } catch (error: any) {
    console.error('getCandidateMedia error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
