import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';
import { EmployeeGoal, GoalStatus } from '../../../models/EmployeeGoal';
import { SkillAssessment } from '../../../models/SkillAssessment';
import { PerformanceRiskAssessment, RiskLevel } from '../../../models/PerformanceRiskAssessment';
import Employee from '../../../models/Employee';

export class PerformanceRiskService {
  async calculateAndSaveRisk(employeeId: string) {
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new Error('Employee not found');
    }

    let riskScore = 10;
    const reasons: string[] = [];

    // 1. Check review score declines & low scores
    const reviews = await PerformanceReview.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: ReviewStatus.SUBMITTED
    }).sort({ createdAt: -1 }).limit(3);

    if (reviews.length > 0) {
      const latest = reviews[0].overallScore;
      
      // Performance Risk: Review Score < 40%
      if (latest < 40) {
        riskScore += 30;
        reasons.push(`Critical performance risk: review score is low (${latest}%)`);
      }

      if (reviews.length >= 2) {
        const prev = reviews[1].overallScore;
        if (latest < prev) {
          riskScore += 20;
          reasons.push(`Review score dropped from ${prev} → ${latest}`);
          
          if (reviews.length >= 3) {
            const prevPrev = reviews[2].overallScore;
            if (prev < prevPrev) {
              riskScore += 25;
              reasons.push(`Consecutive decline in performance scores across the last 3 review periods`);
            }
          }
        }
      }
    }

    // 2. Overdue goals & low goal completion rates
    const now = new Date();
    const overdueGoals = await EmployeeGoal.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: { $ne: GoalStatus.COMPLETED },
      targetDate: { $lt: now }
    });

    if (overdueGoals.length > 0) {
      const points = Math.min(overdueGoals.length * 15, 30);
      riskScore += points;
      for (const goal of overdueGoals) {
        const overdueMs = now.getTime() - new Date(goal.targetDate).getTime();
        const overdueDays = Math.max(1, Math.ceil(overdueMs / (1000 * 60 * 60 * 24)));
        reasons.push(`Goal overdue by ${overdueDays} days`);
      }
    }

    const allGoals = await EmployeeGoal.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });
    if (allGoals.length > 0) {
      let weightedProgress = 0;
      let totalWeight = 0;
      for (const g of allGoals) {
        const weight = g.weightage !== undefined ? g.weightage : 100;
        weightedProgress += (g.progressPercentage || 0) * weight;
        totalWeight += weight;
      }
      const goalCompletionRate = totalWeight > 0 ? (weightedProgress / totalWeight) : 0;
      if (goalCompletionRate < 50) {
        riskScore += 20;
        reasons.push(`Goal completion rate is low (${Math.round(goalCompletionRate)}%)`);
      }
    }

    // 3. Skill gaps > Threshold
    const THRESHOLD = 2; // threshold for critical skill gap
    const criticalSkillGaps = await SkillAssessment.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      gapScore: { $gt: THRESHOLD }
    });

    if (criticalSkillGaps.length > 0) {
      const points = Math.min(criticalSkillGaps.length * 10, 20);
      riskScore += points;
      for (const gap of criticalSkillGaps) {
        reasons.push(`Critical skill gap detected in ${gap.skillName}`);
      }
    }

    // 4. Promotion / Trend Risk: Promotion Readiness Declining
    try {
      const { performanceTrendService } = require('./trend.service');
      const trend = await performanceTrendService.getEmployeeTrend(employeeId);
      if (trend.trendDirection === 'DOWNWARD') {
        riskScore += 25;
        reasons.push(`Promotion readiness declining (performance trend is downward)`);
      }
    } catch (err) {
      console.error('Error fetching trend for risk assessment:', err);
    }

    // Clamp score
    riskScore = Math.min(Math.max(riskScore, 0), 100);

    let riskLevel = RiskLevel.LOW;
    let recommendation = 'Monitor progress on current goals and encourage completion of skill gap training courses.';

    if (riskScore > 60) {
      riskLevel = RiskLevel.HIGH;
      recommendation = 'HIGH RISK ALERT: Immediate manager intervention required. Arrange a 1-on-1 coaching session and review target deliverables.';
    } else if (riskScore > 30) {
      riskLevel = RiskLevel.MEDIUM;
      recommendation = 'Moderate performance risk. Provide mentoring support to close skill gaps and review goal targets.';
    }

    if (reasons.length === 0) {
      reasons.push('No significant risk indicators identified. Keep up the good performance.');
    }

    const assessment = await PerformanceRiskAssessment.findOneAndUpdate(
      { employeeId: new mongoose.Types.ObjectId(employeeId) },
      {
        $set: {
          riskScore,
          riskLevel,
          reasons,
          recommendation,
          assessedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return assessment;
  }

  async getEmployeeRisk(employeeId: string) {
    return await this.calculateAndSaveRisk(employeeId);
  }

  async getHighRiskEmployees(filter: any = {}) {
    // Get all active employees, calculate their risk, and filter high risks
    const employees = await Employee.find({ ...filter, isDeleted: false }).limit(100);
    const results = [];
    for (const emp of employees) {
      try {
        const risk = await this.calculateAndSaveRisk(emp._id.toString());
        if (risk.riskLevel === RiskLevel.HIGH || risk.riskLevel === RiskLevel.MEDIUM) {
          results.push({
            employee: emp,
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel,
            reasons: risk.reasons,
            recommendation: risk.recommendation,
            assessedAt: risk.assessedAt
          });
        }
      } catch (err) {
        console.error(`Error calculating risk for employee ${emp._id}:`, err);
      }
    }
    // Sort by riskScore descending
    return results.sort((a, b) => b.riskScore - a.riskScore);
  }
}

export const performanceRiskService = new PerformanceRiskService();
