import { Request, Response } from 'express';
import Application, { ApplicationStage } from '../models/Application';
import Candidate from '../models/Candidate';
import InterviewSession from '../models/InterviewSession';
import { SessionStatus } from '../types/interview.types';

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const [
      candidateCount,
      appCount,
      completedInterviews,
      candidateStatuses,
      applicationStages
    ] = await Promise.all([
      Candidate.countDocuments({ isDeleted: false }),
      Application.countDocuments({ isDeleted: false }),
      InterviewSession.countDocuments({ status: SessionStatus.COMPLETED }),
      Candidate.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Application.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$currentStage', count: { $sum: 1 } } }
      ])
    ]);

    const overview = {
      totalCandidates: candidateCount || appCount || 0,
      completedInterviews: completedInterviews || 0,
      underReview: 0,
      shortlisted: 0,
      rejected: 0,
      selected: 0,
    };

    candidateStatuses.forEach((status) => {
      switch (status._id) {
        case 'UNDER_REVIEW':
        case 'SCREENING':
          overview.underReview += status.count;
          break;
        case 'SHORTLISTED':
          overview.shortlisted += status.count;
          break;
        case 'REJECTED':
          overview.rejected += status.count;
          break;
        case 'HIRED':
        case 'SELECTED':
          overview.selected += status.count;
          break;
      }
    });

    // Supplement from Application stages if candidate status did not populate them
    applicationStages.forEach((stage) => {
      if (stage._id === ApplicationStage.SCREENING && overview.underReview === 0) {
        overview.underReview += stage.count;
      } else if (stage._id === ApplicationStage.SHORTLISTED && overview.shortlisted === 0) {
        overview.shortlisted += stage.count;
      } else if ((stage._id === ApplicationStage.HIRED || stage._id === ApplicationStage.OFFER) && overview.selected === 0) {
        overview.selected += stage.count;
      } else if (stage._id === ApplicationStage.REJECTED && overview.rejected === 0) {
        overview.rejected += stage.count;
      }
    });

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
