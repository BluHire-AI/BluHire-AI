import mongoose from 'mongoose';
import { SuccessionPlan } from '../../../models/SuccessionPlan';
import { PromotionAssessment } from '../../../models/PromotionAssessment';
import Employee from '../../../models/Employee';
import { performanceService } from './performance.service';

export class PerformanceSuccessionService {
  async generateSuccessionPlan(position: string, currentEmployeeId?: string) {
    const employees = await Employee.find({ isDeleted: false }).limit(20);
    const successorCandidates = [];

    for (const emp of employees) {
      if (currentEmployeeId && emp._id.toString() === currentEmployeeId) {
        continue;
      }

      try {
        const promo = await performanceService.evaluatePromotion(emp._id.toString());
        
        let recommendedTimeline = '12-24 Months';
        if (promo.readinessScore >= 85) {
          recommendedTimeline = 'Immediate';
        } else if (promo.readinessScore >= 70) {
          recommendedTimeline = '6-12 Months';
        }

        const suitabilityReasons = [];
        if (promo.strengths && promo.strengths.length > 0) {
          suitabilityReasons.push(...promo.strengths.slice(0, 3));
        } else {
          suitabilityReasons.push('Demonstrated technical growth and goals completion.');
        }

        successorCandidates.push({
          employeeId: emp._id,
          readinessScore: promo.readinessScore,
          recommendedTimeline,
          suitabilityReasons
        });
      } catch (err) {
        console.error(`Error calculating succession readiness for employee ${emp._id}:`, err);
      }
    }

    successorCandidates.sort((a, b) => b.readinessScore - a.readinessScore);
    const topCandidates = successorCandidates.slice(0, 5);

    const plan = await SuccessionPlan.findOneAndUpdate(
      { position },
      {
        $set: {
          currentEmployee: currentEmployeeId ? new mongoose.Types.ObjectId(currentEmployeeId) : undefined,
          successorCandidates: topCandidates,
          generatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return await SuccessionPlan.findById(plan._id)
      .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
      .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId');
  }

  async getSuccessionPlan(position: string) {
    const plan = await SuccessionPlan.findOne({ position })
      .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
      .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId');

    if (!plan) {
      return await this.generateSuccessionPlan(position);
    }
    return plan;
  }

  async getAllPlans() {
    return await SuccessionPlan.find({})
      .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
      .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId')
      .limit(100);
  }
}

export const performanceSuccessionService = new PerformanceSuccessionService();
