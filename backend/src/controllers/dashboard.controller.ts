import { Request, Response } from 'express';
import Application from '../models/Application';

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const statuses = await Application.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status', // HIRED, REJECTED, etc
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
        case 'UNDER_REVIEW':
        case 'SCREENING':
          overview.underReview += status.count;
          break;
        case 'SHORTLISTED':
        case 'INTERVIEW':
          overview.shortlisted += status.count;
          overview.completedInterviews += status.count; // assuming they finished interview if shortlisted
          break;
        case 'REJECTED':
          overview.rejected += status.count;
          break;
        case 'HIRED':
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
