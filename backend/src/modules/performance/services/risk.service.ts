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

    // 1. Check review score declines
    const reviews = await PerformanceReview.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: ReviewStatus.SUBMITTED
    }).sort({ createdAt: -1 }).limit(3);

    if (reviews.length >= 2) {
      const latest = reviews[0].overallScore;
      const prev = reviews[1].overallScore;
      if (latest < prev) {
        riskScore += 20;
        reasons.push(`Latest performance score declined from ${prev} to ${latest}`);
        
        if (reviews.length >= 3) {
          const prevPrev = reviews[2].overallScore;
          if (prev < prevPrev) {
            riskScore += 25;
            reasons.push(`Consecutive decline in performance scores across the last 3 review periods`);
          }
        }
      }
    }

    // 2. Overdue goals
    const now = new Date();
    const overdueGoalsCount = await EmployeeGoal.countDocuments({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: { $ne: GoalStatus.COMPLETED },
      targetDate: { $lt: now }
    });

    if (overdueGoalsCount > 0) {
      const points = Math.min(overdueGoalsCount * 15, 30);
      riskScore += points;
      reasons.push(`Has ${overdueGoalsCount} overdue performance goals`);
    }

    // 3. Skill gaps
    const skillGapsCount = await SkillAssessment.countDocuments({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      gapScore: { $gt: 0 }
    });

    if (skillGapsCount > 0) {
      const points = Math.min(skillGapsCount * 5, 20);
      riskScore += points;
      reasons.push(`Has ${skillGapsCount} identified skill gaps`);
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
    // Dynamically calculate first to ensure it is fresh
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
