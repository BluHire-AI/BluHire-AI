import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';
import { EmployeeGoal, GoalStatus } from '../../../models/EmployeeGoal';
import { SkillAssessment } from '../../../models/SkillAssessment';
import { PromotionAssessment } from '../../../models/PromotionAssessment';
import Employee from '../../../models/Employee';
import Attendance from '../../../models/Attendance';
import Department from '../../../models/Department';
import Designation from '../../../models/Designation';


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
      return {
        employeeSummary: { currentLevel: 0, targetLevel: 0, gapScore: 0, priority: 'LOW' },
        learningRoadmap: [],
        recommendedResources: [],
        progressTracker: { currentProgress: 0 },
        message: 'No skill assessment records found for this employee to evaluate gaps.'
      };
    }

    const employee = await Employee.findById(employeeId);
    let roleName = 'Staff';
    let deptName = 'Engineering';

    if (employee) {
      if (employee.designationId) {
        const desig = await Designation.findById(employee.designationId);
        if (desig) roleName = desig.title;
      }
      if (employee.departmentId) {
        const dept = await Department.findById(employee.departmentId);
        if (dept) deptName = dept.name;
      }
    }

    const currentSkills = assessments.map(a => ({ name: a.skillName, level: a.currentLevel }));
    const desiredSkills = assessments.map(a => ({ name: a.skillName, level: a.desiredLevel }));

    const gaps = assessments.filter(a => a.gapScore > 0);
    const totCurrent = assessments.reduce((sum, a) => sum + a.currentLevel, 0);
    const totDesired = assessments.reduce((sum, a) => sum + a.desiredLevel, 0);
    const totGap = assessments.reduce((sum, a) => sum + a.gapScore, 0);
    const avgCurrent = assessments.length > 0 ? totCurrent / assessments.length : 5.0;
    const avgDesired = assessments.length > 0 ? totDesired / assessments.length : 8.0;
    const avgGap = assessments.length > 0 ? totGap / assessments.length : 3.0;
    const priority = avgGap >= 2.0 ? 'HIGH' : avgGap > 0 ? 'MEDIUM' : 'LOW';

    const fallbackRoadmap = [
      {
        duration: 'Week 1-2',
        milestone: `Core Foundations in ${gaps.slice(0, 2).map(g => g.skillName).join(', ') || 'Core Skills'}`,
        activities: [
          `Complete fundamental training docs for ${gaps[0]?.skillName || 'core competencies'}.`,
          'Set up local development environments and run baseline tests.'
        ]
      },
      {
        duration: 'Week 3-4',
        milestone: `Intermediate Application & Practice of ${gaps[0]?.skillName || 'Development Frameworks'}`,
        activities: [
          `Build a miniature feature integration utilizing ${gaps[0]?.skillName || 'core components'}.`,
          'Initiate code discussions with senior peers for initial alignment.'
        ]
      },
      {
        duration: 'Week 5-6',
        milestone: `Mentored Deliverables & Gap Closures on ${gaps.slice(1, 3).map(g => g.skillName).join(', ') || 'Advanced Patterns'}`,
        activities: [
          `Refactor production components to address key gaps in ${gaps[1]?.skillName || 'advanced patterns'}.`,
          'Participate in full code reviews and review security profiles.'
        ]
      },
      {
        duration: 'Week 7-8',
        milestone: 'Capstone Project & Production Verification',
        activities: [
          'Deploy complete project to staging environment.',
          'Document integration workflow and complete performance check-off.'
        ]
      }
    ];

    const fallbackResources = [
      {
        name: `Advanced Masterclass: ${gaps[0]?.skillName || 'Software Architecture'}`,
        hours: 12,
        difficulty: 'Intermediate'
      }
    ];
    if (gaps.length > 1) {
      fallbackResources.push({
        name: `Deep Dive: ${gaps[1].skillName}`,
        hours: 18,
        difficulty: 'Advanced'
      });
    } else {
      fallbackResources.push({
        name: 'Enterprise Scaling Practices & Toolkits',
        hours: 15,
        difficulty: 'Advanced'
      });
    }

    const fallbackResult = {
      employeeSummary: {
        currentLevel: Math.round(avgCurrent * 10) / 10,
        targetLevel: Math.round(avgDesired * 10) / 10,
        gapScore: Math.round(avgGap * 10) / 10,
        priority
      },
      learningRoadmap: fallbackRoadmap,
      recommendedResources: fallbackResources,
      progressTracker: {
        currentProgress: 25
      }
    };

    try {
      const response = await fetch(`${this.aiServiceUrl}/performance/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills, desiredSkills, role: roleName, department: deptName })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.employeeSummary && result.learningRoadmap) {
          return result;
        }
      }
    } catch (error) {
      console.error('[PerformanceService] Failed to fetch skill insights, using fallback:', error);
    }

    return fallbackResult;
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
    const tenureMonths = employee.joiningDate
      ? Math.floor((Date.now() - new Date(employee.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
      : 24;
    const tenureScore = Math.min(100, (tenureMonths / 24) * 100);

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
    let avgPerformance = 75.0; // default if no reviews

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
      avgPerformance = scores.overall;
    }

    // 3. Fetch goals completion rate using weighted completion formula
    const goals = await EmployeeGoal.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });
    let goalCompletionRate = 80.0; // default if no goals
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

    // 4. Fetch skill gaps and skill score
    const skillAssessments = await SkillAssessment.find({ employeeId: new mongoose.Types.ObjectId(employeeId) });
    const skillGaps = skillAssessments.filter(s => s.gapScore > 0).map(s => s.skillName);
    let skillScore = 85.0; // default if no skills
    if (skillAssessments.length > 0) {
      let totalGaps = 0;
      let totalDesired = 0;
      for (const s of skillAssessments) {
        totalGaps += s.gapScore || 0;
        totalDesired += s.desiredLevel || 10;
      }
      skillScore = totalDesired > 0 ? Math.max(0, (1 - totalGaps / totalDesired) * 100) : 100;
    }

    // 5. Fetch Attendance Rate
    let attendanceRate = 95.0; // default if no records
    try {
      const totalDays = await Attendance.countDocuments({ employeeId: new mongoose.Types.ObjectId(employeeId) } as any);
      if (totalDays > 0) {
        const presentDays = await Attendance.countDocuments({
          employeeId: new mongoose.Types.ObjectId(employeeId),
          attendanceStatus: { $in: ['PRESENT', 'WORK_FROM_HOME', 'LATE', 'HALF_DAY'] }
        } as any);
        attendanceRate = (presentDays / totalDays) * 100;
      }
    } catch (err) {
      console.error('Error fetching attendance count:', err);
    }

    // 6. Calculate weighted readinessScore
    const readinessScore = Math.round(
      (avgPerformance * 0.35) +
      (goalCompletionRate * 0.25) +
      (skillScore * 0.20) +
      (attendanceRate * 0.10) +
      (tenureScore * 0.10)
    );

    // 7. Query promotion recommendations from Python AI service
    let readinessResult: any = {
      readinessScore,
      recommendedLevel: readinessScore >= 90 ? 'Senior Specialist' : readinessScore >= 75 ? 'Needs Final Review' : 'Remain Current Level',
      strengths: reviews.length > 0 && reviews[0].strengths?.length > 0 ? reviews[0].strengths.slice(0, 3) : ['Analytical focus'],
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
          leadershipScore,
          attendanceRate,
          tenureScore,
          skillScore,
          avgPerformance,
          readinessScore
        })
      });

      if (response.ok) {
        readinessResult = await response.json();
      }
    } catch (error) {
      console.error('[PerformanceService] Failed to generate AI promotion recommendation:', error);
    }

    // 8. Save or update the promotion assessment
    const promotionAssessment = await PromotionAssessment.findOneAndUpdate(
      { employeeId: new mongoose.Types.ObjectId(employeeId) },
      {
        $set: {
          readinessScore: readinessResult.readinessScore !== undefined ? readinessResult.readinessScore : readinessScore,
          recommendedLevel: readinessResult.recommendedLevel || (readinessScore >= 90 ? 'Senior Specialist' : readinessScore >= 75 ? 'Needs Final Review' : 'Remain Current Level'),
          strengths: readinessResult.strengths || (reviews.length > 0 && reviews[0].strengths?.length > 0 ? reviews[0].strengths.slice(0, 3) : ['Analytical focus']),
          skillGaps: readinessResult.skillGaps || skillGaps,
          aiSummary: readinessResult.aiSummary || `Evaluation completed with calculated promotion readiness score of ${readinessScore}%. Key areas analyzed include performance reviews (${avgPerformance.toFixed(0)}%), goal completion (${goalCompletionRate.toFixed(0)}%), skill proficiency (${skillScore.toFixed(0)}%), attendance (${attendanceRate.toFixed(0)}%), and company tenure (${tenureMonths} months).`,
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
