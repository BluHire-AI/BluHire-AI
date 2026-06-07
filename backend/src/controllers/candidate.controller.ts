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

    // Completeness: how many questions were answered vs total
    let completenessScore = 0;
    if (session && session.totalQuestions > 0) {
      completenessScore = Math.min(100, (session.currentQuestionIndex / session.totalQuestions) * 100);
    }

    // Step 1: Get all transcript IDs for this specific session
    const transcripts = await InterviewTranscript.find({ sessionId }).select('_id');
    const transcriptIds = transcripts.map(t => t._id);

    if (transcriptIds.length === 0) {
      // No evaluations yet
      return res.status(200).json({ success: true, data: {
        technicalScore: 0, communicationScore: 0, problemSolvingScore: 0,
        completenessScore, overallScore: 0, recommendation: null, reasoning: null
      }});
    }

    // Step 2: Fetch evaluations scoped to these transcript IDs
    const techEvals = await TechnicalEvaluation.find({ transcriptId: { $in: transcriptIds } });
    const commEvals = await CommunicationAnalysis.find({ transcriptId: { $in: transcriptIds } });
    const probEvals = await ProblemSolvingEvaluation.find({ transcriptId: { $in: transcriptIds } });

    const avg = (arr: any[], field: string) =>
      arr.length > 0 ? arr.reduce((s, e) => s + (e[field] || 0), 0) / arr.length : 0;

    // Evaluations stored as 0–10 (score/10 from the 0–100 AI response)
    const avgTech = avg(techEvals, 'overallTechnicalScore');
    const avgComm = avg(commEvals, 'communicationScore');
    const avgProb = avg(probEvals, 'overallProblemSolvingScore');

    // Scale back to 0–100 for UI
    const technicalScore = Math.round(avgTech * 10);
    const communicationScore = Math.round(avgComm * 10);
    const problemSolvingScore = Math.round(avgProb * 10);

    // Weighted overall: Technical 40%, Communication 30%, Problem Solving 30%
    const overallScore = Math.round(
      (technicalScore * 0.40) +
      (communicationScore * 0.30) +
      (problemSolvingScore * 0.30)
    );

    // Fetch recommendation
    const rec = await InterviewRecommendation.findOne({ sessionId });

    res.status(200).json({
      success: true,
      data: {
        technicalScore,
        communicationScore,
        problemSolvingScore,
        completenessScore: Math.round(completenessScore),
        overallScore,
        recommendation: rec?.recommendation ?? null,
        confidence: rec?.confidence ?? null,
        reasoning: rec?.reasoning ?? null,
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

export const getCandidateMedia = async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const transcripts = await InterviewTranscript.find({ sessionId }).sort({ questionIndex: 1 });
    const recordings = await InterviewRecording.find({ sessionId }).sort({ questionIndex: 1 });

    res.status(200).json({ success: true, data: { transcripts, recordings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
