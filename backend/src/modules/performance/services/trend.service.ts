import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';

export interface ITrendSummary {
  employeeId: string;
  scores: number[];
  periods: string[];
  rollingAverage: number;
  trendDirection: 'UPWARD' | 'STABLE' | 'DOWNWARD';
  scoreChange: number;
}

export class PerformanceTrendService {
  async getEmployeeTrend(employeeId: string): Promise<ITrendSummary> {
    const reviews = await PerformanceReview.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: ReviewStatus.SUBMITTED
    }).sort({ createdAt: 1 }).limit(100);

    if (reviews.length === 0) {
      return {
        employeeId,
        scores: [],
        periods: [],
        rollingAverage: 0,
        trendDirection: 'STABLE',
        scoreChange: 0
      };
    }

    const scores = reviews.map(r => r.overallScore);
    const periods = reviews.map(r => r.reviewPeriod);
    const sum = scores.reduce((a, b) => a + b, 0);
    const rollingAverage = Math.round((sum / scores.length) * 10) / 10;

    let trendDirection: 'UPWARD' | 'STABLE' | 'DOWNWARD' = 'STABLE';
    let scoreChange = 0;

    if (scores.length >= 2) {
      const latest = scores[scores.length - 1];
      const previous = scores[scores.length - 2];
      scoreChange = latest - previous;
      if (scoreChange > 2) {
        trendDirection = 'UPWARD';
      } else if (scoreChange < -2) {
        trendDirection = 'DOWNWARD';
      } else {
        trendDirection = 'STABLE';
      }
    }

    return {
      employeeId,
      scores,
      periods,
      rollingAverage,
      trendDirection,
      scoreChange
    };
  }
}

export const performanceTrendService = new PerformanceTrendService();
