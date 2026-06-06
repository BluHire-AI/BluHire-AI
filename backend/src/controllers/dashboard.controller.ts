import { Request, Response } from 'express';
import CandidateApplicationStatus from '../models/CandidateApplicationStatus';

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const statuses = await CandidateApplicationStatus.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const overview = {
      totalCandidates: 0,
      completedInterviews: 0,
      underReview: 0,
      shortlisted: 0,
      rejected: 0,
      selected: 0,
    };

    statuses.forEach((status) => {
      overview.totalCandidates += status.count;
      switch (status._id) {
        case 'INTERVIEW_COMPLETED': // In case there's an intermediate state
        case 'UNDER_REVIEW':
          overview.underReview += status.count;
          overview.completedInterviews += status.count;
          break;
        case 'SHORTLISTED':
          overview.shortlisted += status.count;
          overview.completedInterviews += status.count;
          break;
        case 'REJECTED':
          overview.rejected += status.count;
          overview.completedInterviews += status.count;
          break;
        case 'SELECTED':
          overview.selected += status.count;
          overview.completedInterviews += status.count;
          break;
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
