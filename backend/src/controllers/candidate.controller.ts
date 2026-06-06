import { Request, Response } from 'express';
import CandidateApplicationStatus from '../models/CandidateApplicationStatus';
import InterviewSession from '../models/InterviewSession';
import InterviewReport from '../models/InterviewReport';
import InterviewScore from '../models/InterviewScore';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import CommunicationAnalysis from '../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../models/ProblemSolvingEvaluation';

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await CandidateApplicationStatus.find()
      .populate('candidateId', 'firstName lastName email')
      .populate('sessionId', 'status startedAt completedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const candidateStatus = await CandidateApplicationStatus.findById(req.params.id)
      .populate('candidateId')
      .populate('sessionId');
    
    if (!candidateStatus) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.status(200).json({ success: true, data: candidateStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateReport = async (req: Request, res: Response) => {
  try {
    const appStatus = await CandidateApplicationStatus.findById(req.params.id);
    if (!appStatus || !appStatus.sessionId) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = await InterviewReport.findOne({ sessionId: appStatus.sessionId });
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCandidateScorecard = async (req: Request, res: Response) => {
  try {
    const appStatus = await CandidateApplicationStatus.findById(req.params.id);
    if (!appStatus || !appStatus.sessionId) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // Since we don't have a single "InterviewScore" populated directly in this phase easily,
    // we aggregate the underlying evaluations.
    const sessionId = appStatus.sessionId;
    const session = await InterviewSession.findById(sessionId);

    // Compute completeness (answered questions / total questions) * 100
    let completenessScore = 0;
    if (session && session.totalQuestions > 0) {
      completenessScore = (session.currentQuestionIndex / session.totalQuestions) * 100;
    }

    // Aggregate Technical, Communication, and Problem Solving averages from the transcripts
    const techEvals = await TechnicalEvaluation.find().populate({
      path: 'transcriptId',
      match: { sessionId }
    });
    
    // In a real scenario we filter out nulls if populated failed due to match
    const validTechEvals = techEvals.filter(e => e.transcriptId);
    const avgTech = validTechEvals.length > 0 
      ? validTechEvals.reduce((acc, curr) => acc + curr.overallTechnicalScore, 0) / validTechEvals.length 
      : 0;

    const commEvals = await CommunicationAnalysis.find().populate({
      path: 'transcriptId',
      match: { sessionId }
    });
    const validCommEvals = commEvals.filter(e => e.transcriptId);
    const avgComm = validCommEvals.length > 0 
      ? validCommEvals.reduce((acc, curr) => acc + curr.communicationScore, 0) / validCommEvals.length 
      : 0;

    const probEvals = await ProblemSolvingEvaluation.find().populate({
      path: 'transcriptId',
      match: { sessionId }
    });
    const validProbEvals = probEvals.filter(e => e.transcriptId);
    const avgProb = validProbEvals.length > 0 
      ? validProbEvals.reduce((acc, curr) => acc + curr.overallProblemSolvingScore, 0) / validProbEvals.length 
      : 0;

    // Formula: Technical (40%), Communication (25%), Problem Solving (25%), Completeness (10%)
    // Assuming scores are out of 10 for AI and completeness is percentage, scale all to 100
    const scaledTech = avgTech * 10;
    const scaledComm = avgComm * 10;
    const scaledProb = avgProb * 10;
    
    const overallScore = (scaledTech * 0.40) + (scaledComm * 0.25) + (scaledProb * 0.25) + (completenessScore * 0.10);

    const scorecard = {
      technicalScore: scaledTech,
      communicationScore: scaledComm,
      problemSolvingScore: scaledProb,
      completenessScore,
      overallScore,
    };

    res.status(200).json({ success: true, data: scorecard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateCandidateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const candidateStatus = await CandidateApplicationStatus.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json({ success: true, data: candidateStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getRankings = async (req: Request, res: Response) => {
  // This is a simplified ranking generator. In production, this data should be cached or stored directly on the ApplicationStatus model on completion.
  try {
    const applications = await CandidateApplicationStatus.find()
      .populate('candidateId', 'firstName lastName email')
      .populate('sessionId');

    // For demonstration, returning mock structure. To implement fully, we'd iterate and run the scorecard logic for each, then sort.
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const compareCandidates = async (req: Request, res: Response) => {
  try {
    const ids = req.query.ids as string;
    if (!ids) {
      return res.status(400).json({ success: false, message: 'Provide candidate ids to compare' });
    }
    const idArray = ids.split(',');
    
    const candidates = await CandidateApplicationStatus.find({ _id: { $in: idArray } })
      .populate('candidateId', 'firstName lastName');
      
    // Return base info for UI to render comparison
    res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
