import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';
import Employee from '../../../models/Employee';

export class PerformanceCalibrationService {
  async getCalibration(filter: any = {}) {
    // Exclude soft-deleted employees
    const employees = await Employee.find({ ...filter, isDeleted: false }).limit(100);
    const employeeIds = employees.map(e => e._id);

    // Fetch the latest submitted review for each employee
    const reviews = await PerformanceReview.find({
      employeeId: { $in: employeeIds },
      status: ReviewStatus.SUBMITTED
    }).populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .sort({ createdAt: -1 });

    // Use a Map to only keep the latest review per employee
    const latestReviewsMap = new Map<string, any>();
    for (const review of reviews) {
      const empIdStr = review.employeeId._id.toString();
      if (!latestReviewsMap.has(empIdStr)) {
        latestReviewsMap.set(empIdStr, review);
      }
    }

    const latestReviews = Array.from(latestReviewsMap.values());

    const top: any[] = [];
    const strong: any[] = [];
    const average: any[] = [];
    const needsImprovement: any[] = [];

    for (const r of latestReviews) {
      const score = r.overallScore;
      if (score >= 90) {
        top.push(r);
      } else if (score >= 75) {
        strong.push(r);
      } else if (score >= 50) {
        average.push(r);
      } else {
        needsImprovement.push(r);
      }
    }

    const total = latestReviews.length;
    const distribution = {
      top: { count: top.length, percentage: total > 0 ? Math.round((top.length / total) * 100) : 0 },
      strong: { count: strong.length, percentage: total > 0 ? Math.round((strong.length / total) * 100) : 0 },
      average: { count: average.length, percentage: total > 0 ? Math.round((average.length / total) * 100) : 0 },
      needsImprovement: { count: needsImprovement.length, percentage: total > 0 ? Math.round((needsImprovement.length / total) * 100) : 0 }
    };

    return {
      distribution,
      categories: {
        top,
        strong,
        average,
        needsImprovement
      }
    };
  }
}

export const performanceCalibrationService = new PerformanceCalibrationService();
