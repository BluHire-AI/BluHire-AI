import mongoose from 'mongoose';
import { env } from '../../../config/env';
import { PerformanceReview, ReviewStatus, ReviewType } from '../../../models/PerformanceReview';
import { EmployeeGoal, GoalStatus, GoalPriority } from '../../../models/EmployeeGoal';
import { SkillAssessment } from '../../../models/SkillAssessment';
import { PromotionAssessment } from '../../../models/PromotionAssessment';
import EmployeeModel, { EmploymentStatus, EmploymentType } from '../../../models/Employee';
import { User as UserModel } from '../../../models/User';
import { SystemRoles } from '../../../models/roles';
import { performanceService } from '../services/performance.service';
import { analyticsService } from '../services/analytics.service';
import { getScopedAccess } from '../controllers/rbac.helper';
import { performanceTrendService } from '../services/trend.service';
import { performanceRiskService } from '../services/risk.service';
import { performanceLearningService } from '../services/learning.service';
import { performanceCalibrationService } from '../services/calibration.service';
import { performanceSuccessionService } from '../services/succession.service';
import { PerformanceRiskAssessment } from '../../../models/PerformanceRiskAssessment';
import { SuccessionPlan } from '../../../models/SuccessionPlan';
import toolRegistry from '../../copilot/tools/registry';
import '../../copilot/tools/definitions';


// Mock the global fetch API to prevent hitting external OpenRouter APIs during tests
const originalFetch = global.fetch;

async function runTests() {
  console.log('=== STARTING PERFORMANCE MODULE INTEGRATION TESTS ===');

  // Setup fetch mock
  global.fetch = (async (url: string, options: any) => {
    if (url.includes('/performance/summary')) {
      return {
        ok: true,
        json: async () => ({ summary: 'AI Mocked Review: Highly competent engineer.' })
      };
    }
    if (url.includes('/performance/promotion')) {
      return {
        ok: true,
        json: async () => ({
          readinessScore: 92,
          recommendedLevel: 'Senior Specialist',
          strengths: ['Architecture Design', 'Communication'],
          skillGaps: ['Rust Programming'],
          aiSummary: 'AI Mocked Timeline: Fully recommended for immediate promotion.'
        })
      };
    }
    if (url.includes('/performance/learning-plan')) {
      return {
        ok: true,
        json: async () => ({
          courses: [
            {
              courseName: 'Advanced TypeScript & Architecture Patterns',
              topics: ['Generic Types', 'Decorators', 'Performance Tuning'],
              duration: '3 weeks'
            }
          ]
        })
      };
    }
    return { ok: false, json: async () => ({}) };
  }) as any;

  // 1. Establish DB Connection
  await mongoose.connect(env.MONGO_URI);
  console.log('MongoDB connected successfully.');

  // Initialize test IDs
  const testUserId = new mongoose.Types.ObjectId();
  const reviewerUserId = new mongoose.Types.ObjectId();
  const departmentId = new mongoose.Types.ObjectId();
  const designationId = new mongoose.Types.ObjectId();

  let testEmployee: any = null;

  try {
    // 2. Setup mock employee
    console.log('\nSetting up test employee...');
    await EmployeeModel.deleteMany({ employeeCode: 'EMP-PERF-TEST' });
    testEmployee = await EmployeeModel.create({
      employeeCode: 'EMP-PERF-TEST',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      phone: '+1555019902',
      joiningDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30.4375 * 18), // 18 months tenure
      departmentId: departmentId.toString(),
      designationId: designationId.toString(),
      employmentStatus: EmploymentStatus.ACTIVE,
      employmentType: EmploymentType.FULL_TIME,
      workLocation: 'Remote',
      createdBy: reviewerUserId.toString(),
      isDeleted: false
    });
    console.log('✔ Test employee created.');

    // 3. Test Skill Assessment & Gap Score calculation
    console.log('\nTesting Skill Assessment & pre-save Gap score...');
    await SkillAssessment.deleteMany({ employeeId: testEmployee._id });
    
    const skillPayload = {
      employeeId: testEmployee._id.toString(),
      skillName: 'TypeScript',
      currentLevel: 6,
      desiredLevel: 9
    };
    const skillAssessment = await performanceService.assessSkill(skillPayload, reviewerUserId.toString());
    
    console.assert(skillAssessment.gapScore === 3, `Expected gap score 3, got ${skillAssessment.gapScore}`);
    console.log('✔ Skill gap calculation test passed.');

    // 4. Test Employee Goal CRUD and completed auto-updates
    console.log('\nTesting Employee Goal completion rules...');
    await EmployeeGoal.deleteMany({ employeeId: testEmployee._id });
    
    const goalPayload = {
      employeeId: testEmployee._id.toString(),
      title: 'Complete System Architecture Draft',
      description: 'Draft the core system microservices map.',
      category: 'Technical',
      priority: GoalPriority.HIGH,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      progressPercentage: 50,
      status: GoalStatus.IN_PROGRESS
    };

    const goal = await performanceService.createGoal(goalPayload, reviewerUserId.toString());
    console.assert(goal.goalCode !== undefined, 'Goal code should be generated automatically.');
    console.assert(goal.status === GoalStatus.IN_PROGRESS, 'Goal status should be IN_PROGRESS.');

    // Update goal to completed status
    const completedGoal = await performanceService.updateGoal(goal._id.toString(), { status: GoalStatus.COMPLETED });
    console.assert(completedGoal?.progressPercentage === 100, `Expected progress percentage to be 100, got ${completedGoal?.progressPercentage}`);

    // Update goal progress to 100 manually
    const progressGoal = await performanceService.updateGoal(goal._id.toString(), { progressPercentage: 100 });
    console.assert(progressGoal?.status === GoalStatus.COMPLETED, `Expected status COMPLETED, got ${progressGoal?.status}`);

    console.log('✔ Goal completion rules passed.');

    // 5. Test Performance Review creation & AI coaching comment integration
    console.log('\nTesting Performance Review & AI summary trigger...');
    await PerformanceReview.deleteMany({ employeeId: testEmployee._id });

    const reviewPayload = {
      employeeId: testEmployee._id.toString(),
      reviewPeriod: 'Q1 2026',
      reviewType: ReviewType.QUARTERLY,
      overallScore: 88,
      communicationScore: 8,
      technicalScore: 9,
      leadershipScore: 7,
      productivityScore: 9,
      teamworkScore: 8,
      comments: 'Alice is performing exceptionally well in architecture designs.',
      strengths: ['Microservices', 'Communication'],
      weaknesses: ['Rust'],
      status: ReviewStatus.SUBMITTED
    };

    const review = await performanceService.createReview(reviewPayload, reviewerUserId.toString());
    console.assert(review.reviewCode !== undefined, 'Review code should be generated.');
    console.assert(review.comments.includes('[AI Coach Feedback]'), 'Comments should be appended with AI Coach Feedback.');
    
    console.log('✔ Performance review submission and AI summaries tests passed.');

    // 6. Test AI-driven Promotion Assessment Readiness Engine
    console.log('\nTesting AI Promotion readiness assessment calculator...');
    await PromotionAssessment.deleteMany({ employeeId: testEmployee._id });

    const promoAssessment = await performanceService.evaluatePromotion(testEmployee._id.toString());
    console.assert(promoAssessment.readinessScore === 92, `Expected readiness score 92, got ${promoAssessment.readinessScore}`);
    console.assert(promoAssessment.recommendedLevel === 'Senior Specialist', `Expected level "Senior Specialist", got "${promoAssessment.recommendedLevel}"`);
    console.assert(promoAssessment.aiSummary.includes('Fully recommended'), 'AI summary recommendation is missing details.');

    console.log('✔ Promotion readiness assessment calculator passed.');

    // 7. Test RBAC Scoped filters
    console.log('\nTesting RBAC Scoped filter evaluations...');
    
    // Employee Role scope
    const employeeUser = {
      _id: reviewerUserId,
      role: SystemRoles.EMPLOYEE
    };
    // Mock user employee record mapping
    await EmployeeModel.findOneAndUpdate({ createdBy: reviewerUserId.toString() }, { userId: reviewerUserId.toString() });
    const empScope = await getScopedAccess(employeeUser);
    console.assert(empScope.employeeId === testEmployee._id.toString(), 'EMPLOYEE role filter should restrict exclusively to employee record ID.');

    // Senior Manager scope
    const managerUser = {
      _id: reviewerUserId,
      role: SystemRoles.SENIOR_MANAGER
    };
    const managerScope = await getScopedAccess(managerUser);
    console.assert(managerScope.departmentId === departmentId.toString(), 'SENIOR_MANAGER role filter should map to their department ID.');

    console.log('✔ RBAC Scoped filters evaluations passed.');

    // 8. Test Copilot Tools Registry loading
    console.log('\nTesting Copilot Tools registry load validations...');
    const performanceToolNames = [
      'getTopPerformers',
      'getPromotionCandidates',
      'getSkillGapAnalysis',
      'getGoalCompletionRates',
      'getEmployeePerformance',
      'generatePerformanceReport',
      'getPerformanceTrend',
      'getHighRiskEmployees',
      'getLearningPlan',
      'getCalibrationDistribution',
      'getSuccessionCandidates',
      'generateSuccessionReport'
    ];
    for (const toolName of performanceToolNames) {
      const tool = toolRegistry.getTool(toolName);
      console.assert(tool !== undefined, `Performance tool '${toolName}' was not registered in ToolRegistry.`);
    }
    console.log('✔ Copilot tools registry verified.');

    // 9. Test Enhancements (Module 8.1)
    console.log('\nTesting Module 8.1 Enhancements...');
    
    // A. Goal Weightage & Weighted Goal Completion Rate
    await EmployeeGoal.deleteMany({ employeeId: testEmployee._id });
    await performanceService.createGoal({
      employeeId: testEmployee._id.toString(),
      title: 'Weighted Goal 1',
      category: 'Technical',
      priority: GoalPriority.MEDIUM,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      progressPercentage: 50,
      weightage: 50,
      status: GoalStatus.IN_PROGRESS
    }, reviewerUserId.toString());

    await performanceService.createGoal({
      employeeId: testEmployee._id.toString(),
      title: 'Weighted Goal 2',
      category: 'Technical',
      priority: GoalPriority.HIGH,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      progressPercentage: 100,
      weightage: 80,
      status: GoalStatus.COMPLETED
    }, reviewerUserId.toString());

    const evalResult = await performanceService.evaluatePromotion(testEmployee._id.toString());
    console.assert(evalResult !== null, 'Promotion evaluation should calculate successfully with weighted goal rate.');

    // B. Performance Trend service
    const trend = await performanceTrendService.getEmployeeTrend(testEmployee._id.toString());
    console.assert(trend.employeeId === testEmployee._id.toString(), 'Trend employeeId should match.');
    console.assert(typeof trend.rollingAverage === 'number', 'Rolling average should be calculated.');

    // C. Performance Risk service
    const risk = await performanceRiskService.getEmployeeRisk(testEmployee._id.toString());
    console.assert(risk.riskScore !== undefined, 'Risk score should be calculated.');
    console.assert(risk.riskLevel !== undefined, 'Risk level should be defined.');

    // D. Learning Plan service
    const learning = await performanceLearningService.getLearningPlan(testEmployee._id.toString());
    console.assert(learning.courses !== undefined, 'Learning plan courses should be defined.');
    console.assert(learning.courses.length > 0, 'Learning plan should return at least one course.');

    // E. Calibration Distribution service
    const calibration = await performanceCalibrationService.getCalibration();
    console.assert(calibration.distribution !== undefined, 'Calibration distribution should be populated.');
    console.assert(calibration.categories !== undefined, 'Calibration categories should be populated.');

    // F. Succession Planning service
    const succession = await performanceSuccessionService.getSuccessionPlan('Chief Technical Architect');
    console.assert(succession !== null, 'Succession plan should be retrieved.');
    if (succession) {
      console.assert(succession.position === 'Chief Technical Architect', 'Succession position name should match.');
      console.assert(succession.successorCandidates !== undefined, 'Successor candidates list should be populated.');
    }

    console.log('✔ Module 8.1 Enhancements integration checks passed.');

    // Cleanup
    console.log('\nCleaning up database testing records...');
    await EmployeeModel.deleteOne({ _id: testEmployee._id });
    await SkillAssessment.deleteMany({ employeeId: testEmployee._id });
    await EmployeeGoal.deleteMany({ employeeId: testEmployee._id });
    await PerformanceReview.deleteMany({ employeeId: testEmployee._id });
    await PromotionAssessment.deleteMany({ employeeId: testEmployee._id });
    await PerformanceRiskAssessment.deleteMany({ employeeId: testEmployee._id });
    await SuccessionPlan.deleteMany({ position: 'Chief Technical Architect' });
    console.log('✔ Cleanup completed.');

    console.log('\n=================================================');
    console.log('ALL MODULE 8 PERFORMANCE INTEGRATION TESTS PASSED!');
    console.log('=================================================');

  } catch (error) {
    console.error('❌ TEST SUITE FAILED WITH ERROR:', error);
    // Cleanup if employee created
    if (testEmployee) {
      await EmployeeModel.deleteOne({ _id: testEmployee._id });
      await SkillAssessment.deleteMany({ employeeId: testEmployee._id });
      await EmployeeGoal.deleteMany({ employeeId: testEmployee._id });
      await PerformanceReview.deleteMany({ employeeId: testEmployee._id });
      await PromotionAssessment.deleteMany({ employeeId: testEmployee._id });
      await PerformanceRiskAssessment.deleteMany({ employeeId: testEmployee._id });
      await SuccessionPlan.deleteMany({ position: 'Chief Technical Architect' });
    }
    process.exit(1);
  } finally {
    global.fetch = originalFetch;
    await mongoose.disconnect();
  }
}

runTests();
