import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';
import { EmployeeGoal, GoalStatus } from '../../../models/EmployeeGoal';
import { SkillAssessment } from '../../../models/SkillAssessment';
import { PromotionAssessment } from '../../../models/PromotionAssessment';
import Employee from '../../../models/Employee';

export class PerformanceService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

  // ==========================================
  // Performance Reviews
  // ==========================================

  async createReview(data: any, reviewerId: string) {
    const count = await PerformanceReview.countDocuments();
    const reviewCode = `REV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let comments = data.comments;

    // Trigger AI Performance summary if status is SUBMITTED
    if (data.status === ReviewStatus.SUBMITTED) {
      try {
        const response = await fetch(`${this.aiServiceUrl}/performance/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scores: {
              communication: data.communicationScore,
              technical: data.technicalScore,
              leadership: data.leadershipScore,
              productivity: data.productivityScore,
              teamwork: data.teamworkScore
            },
            comments: data.comments,
            strengths: data.strengths,
            weaknesses: data.weaknesses
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.summary) {
            comments = `${data.comments}\n\n[AI Coach Feedback]\n${resJson.summary}`;
          }
        }
      } catch (error) {
        console.error('[PerformanceService] Failed to fetch AI summary:', error);
      }
    }

    const review = new PerformanceReview({
      ...data,
      reviewCode,
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      employeeId: new mongoose.Types.ObjectId(data.employeeId),
      comments
    });

    return await review.save();
  }

  async updateReview(id: string, data: any) {
    let comments = data.comments;

    if (data.status === ReviewStatus.SUBMITTED && data.comments) {
      try {
        const response = await fetch(`${this.aiServiceUrl}/performance/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scores: {
              communication: data.communicationScore || 5,
              technical: data.technicalScore || 5,
              leadership: data.leadershipScore || 5,
              productivity: data.productivityScore || 5,
              teamwork: data.teamworkScore || 5
            },
            comments: data.comments,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || []
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.summary) {
            comments = `${data.comments}\n\n[AI Coach Feedback]\n${resJson.summary}`;
          }
        }
      } catch (error) {
        console.error('[PerformanceService] Failed to update AI summary:', error);
      }
    }

    const updateData = { ...data };
    if (comments) updateData.comments = comments;

    return await PerformanceReview.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  async getReviews(filter: any, page: number = 1, limit: number = 10) {
    const clampedLimit = Math.min(limit, 100);
    const skip = (page - 1) * clampedLimit;

    const query = { ...filter };
    const items = await PerformanceReview.find(query)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .populate('reviewerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(clampedLimit);

    const total = await PerformanceReview.countDocuments(query);

    return {
      items,
      total,
      page,
      limit: clampedLimit
    };
  }

  async getReviewById(id: string) {
    return await PerformanceReview.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .populate('reviewerId', 'firstName lastName email');
  }

  async deleteReview(id: string) {
    return await PerformanceReview.findByIdAndDelete(id);
  }

  // ==========================================
  // Goals Management
  // ==========================================

  async createGoal(data: any, creatorId: string) {
    const count = await EmployeeGoal.countDocuments();
    const goalCode = `GOL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const goal = new EmployeeGoal({
      ...data,
      goalCode,
      employeeId: new mongoose.Types.ObjectId(data.employeeId),
      createdBy: new mongoose.Types.ObjectId(creatorId)
    });

    return await goal.save();
  }

  async updateGoal(id: string, data: any) {
    // If status is updated to COMPLETED, ensure progress is 100
    if (data.status === GoalStatus.COMPLETED) {
      data.progressPercentage = 100;
    } else if (data.progressPercentage === 100) {
      data.status = GoalStatus.COMPLETED;
    }

    return await EmployeeGoal.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: 'after' }
    );
  }

  async getGoals(filter: any) {
    // Clamped query limit for safety
    return await EmployeeGoal.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .sort({ targetDate: 1 })
      .limit(100);
  }

  async getGoalById(id: string) {
    return await EmployeeGoal.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId');
  }

  async deleteGoal(id: string) {
    return await EmployeeGoal.findByIdAndDelete(id);
  }

  // ==========================================
  // Skill Competency Assessments
  // ==========================================

  async assessSkill(data: any, assessorId: string) {
    // Check if skill assessment already exists for the employee and skill
    const query = {
      employeeId: new mongoose.Types.ObjectId(data.employeeId),
      skillName: data.skillName
    };

    const updateData = {
      ...data,
      assessedBy: new mongoose.Types.ObjectId(assessorId),
      assessmentDate: new Date()
    };

    const assessment = await SkillAssessment.findOneAndUpdate(
      query,
      { $set: updateData },
      { upsert: true, returnDocument: 'after' }
    );

    // Trigger post-save manually if pre-save hook is not invoked on findOneAndUpdate
    assessment.gapScore = Math.max(0, assessment.desiredLevel - assessment.currentLevel);
    await assessment.save();

    return assessment;
  }

  async getSkills(filter: any) {
    return await SkillAssessment.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .populate('assessedBy', 'firstName lastName')
      .sort({ assessmentDate: -1 })
      .limit(100);
  }

  async getSkillInsights(employeeId: string) {
    const assessments = await SkillAssessment.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });
    if (assessments.length === 0) {
      return { insights: 'No skill assessment records found for this employee to evaluate gaps.' };
    }

    const currentSkills = assessments.map(a => ({ name: a.skillName, level: a.currentLevel }));
    const desiredSkills = assessments.map(a => ({ name: a.skillName, level: a.desiredLevel }));

    try {
      const response = await fetch(`${this.aiServiceUrl}/performance/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills, desiredSkills })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('[PerformanceService] Failed to fetch skill insights:', error);
    }

    return { insights: 'Could not communicate with AI Coach for skill gap insights.' };
  }

  // ==========================================
  // Promotion Assessment Readiness Engine
  // ==========================================

  async evaluatePromotion(employeeId: string) {
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new Error('Employee not found or has been soft-deleted');
    }

    // 1. Calculate tenure in months
    const tenureMonths = Math.floor(
      (Date.now() - new Date(employee.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
    );

    // 2. Fetch all submitted reviews
    const reviews = await PerformanceReview.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: ReviewStatus.SUBMITTED
    });

    const scores = {
      communication: 5.0,
      technical: 5.0,
      leadership: 5.0,
      productivity: 5.0,
      teamwork: 5.0,
      overall: 50.0
    };

    let leadershipScore = 5.0;

    if (reviews.length > 0) {
      const sums = reviews.reduce(
        (acc, r) => {
          acc.comm += r.communicationScore;
          acc.tech += r.technicalScore;
          acc.lead += r.leadershipScore;
          acc.prod += r.productivityScore;
          acc.team += r.teamworkScore;
          acc.over += r.overallScore;
          return acc;
        },
        { comm: 0, tech: 0, lead: 0, prod: 0, team: 0, over: 0 }
      );

      scores.communication = sums.comm / reviews.length;
      scores.technical = sums.tech / reviews.length;
      scores.leadership = sums.lead / reviews.length;
      scores.productivity = sums.prod / reviews.length;
      scores.teamwork = sums.team / reviews.length;
      scores.overall = sums.over / reviews.length;

      leadershipScore = scores.leadership;
    }

    // 3. Fetch goals completion rate using weighted completion formula
    const goals = await EmployeeGoal.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });
    let goalCompletionRate = 0.0;
    if (goals.length > 0) {
      let weightedProgressSum = 0;
      let totalWeightage = 0;
      for (const g of goals) {
        const progress = g.progressPercentage || 0;
        const weight = g.weightage !== undefined ? g.weightage : 100;
        weightedProgressSum += (progress * weight);
        totalWeightage += weight;
      }
      goalCompletionRate = totalWeightage > 0 ? (weightedProgressSum / totalWeightage) : 0.0;
    }

    // 4. Fetch skill gaps
    const skillAssessments = await SkillAssessment.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      gapScore: { $gt: 0 }
    });
    const skillGaps = skillAssessments.map(s => s.skillName);

    // 5. Query promotion recommendations from Python AI service
    let readinessResult: any = {
      readinessScore: 50,
      recommendedLevel: 'Needs Review',
      strengths: ['Analytical focus'],
      skillGaps: skillGaps,
      aiSummary: 'Local fallback assessment. Review employee records manually.'
    };

    try {
      const response = await fetch(`${this.aiServiceUrl}/performance/promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores,
          goalCompletionRate,
          skillGaps,
          tenureMonths,
          leadershipScore
        })
      });

      if (response.ok) {
        readinessResult = await response.json();
      }
    } catch (error) {
      console.error('[PerformanceService] Failed to generate AI promotion recommendation:', error);
    }

    // 6. Save or update the promotion assessment
    const promotionAssessment = await PromotionAssessment.findOneAndUpdate(
      { employeeId: new mongoose.Types.ObjectId(employeeId) },
      {
        $set: {
          readinessScore: readinessResult.readinessScore,
          recommendedLevel: readinessResult.recommendedLevel,
          strengths: readinessResult.strengths || [],
          skillGaps: readinessResult.skillGaps || skillGaps,
          aiSummary: readinessResult.aiSummary || '',
          generatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return promotionAssessment;
  }

  async getPromotionAssessments(filter: any) {
    return await PromotionAssessment.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId')
      .sort({ readinessScore: -1 })
      .limit(100);
  }

  async getPromotionAssessmentByEmployee(employeeId: string) {
    return await PromotionAssessment.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) })
      .populate('employeeId', 'firstName lastName employeeCode departmentId designationId');
  }
}

export const performanceService = new PerformanceService();
