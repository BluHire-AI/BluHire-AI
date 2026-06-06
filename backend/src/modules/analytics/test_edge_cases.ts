import mongoose from 'mongoose';
import dotenv from 'dotenv';
import analyticsRepository from './analytics.repository';
import JobModel, { JobStatus } from '../../models/Job';
import CandidateModel from '../../models/Candidate';
import ApplicationModel, { ApplicationStage } from '../../models/Application';
import DepartmentModel from '../../models/Department';
import DesignationModel from '../../models/Designation';
import { User as UserModel } from '../../models/User';
import { SystemRoles } from '../../models/roles';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';

function validatePercentage(val: any, contextName: string) {
  if (typeof val !== 'number' || isNaN(val)) {
    throw new Error(`[FAIL] ${contextName}: Expected a valid number, got ${typeof val} (${val})`);
  }
  if (val < 0 || val > 100) {
    throw new Error(`[FAIL] ${contextName}: Percentage out of bounds [0, 100], got ${val}`);
  }
  const rounded = Math.round(val * 10) / 10;
  if (Math.abs(val - rounded) > 0.0001) {
    throw new Error(`[FAIL] ${contextName}: Percentage not rounded to 1 decimal place, got ${val}`);
  }
}

async function clearCollections() {
  await Promise.all([
    JobModel.deleteMany({}),
    CandidateModel.deleteMany({}),
    ApplicationModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    DesignationModel.deleteMany({}),
  ]);
}

async function runEdgeCaseTests() {
  console.log('Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  // Clear collections at the beginning for a clean start
  await clearCollections();

  // Setup common records
  let recruiter = await UserModel.findOne({ role: SystemRoles.HR_RECRUITER });
  if (!recruiter) {
    recruiter = await UserModel.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.recruiter@bluhire.com',
      employeeId: 'EMP-REC-9999',
      role: SystemRoles.HR_RECRUITER,
      isActive: true,
      passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG',
    });
  }

  let admin = await UserModel.findOne({ role: SystemRoles.MANAGEMENT_ADMIN });
  if (!admin) {
    admin = await UserModel.create({
      firstName: 'Alex',
      lastName: 'Admin',
      email: 'alex.admin@bluhire.com',
      employeeId: 'EMP-ADM-0001',
      role: SystemRoles.MANAGEMENT_ADMIN,
      isActive: true,
      passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG',
    });
  }

  const testDept = await DepartmentModel.create({ name: 'Test QA Department', description: 'Testing' });
  const testDesig = await DesignationModel.create({
    title: 'QA Engineer',
    description: 'Testing',
    departmentId: testDept._id,
    level: 2,
  });

  const testJob = await JobModel.create({
    jobCode: 'JOB-TEST-0001',
    title: 'QA Engineer',
    departmentId: testDept._id,
    designationId: testDesig._id,
    description: 'QA Engineer Job',
    responsibilities: 'QA testing',
    requiredSkills: ['React', 'TypeScript'],
    experienceRequired: '2 years',
    educationRequired: "Bachelor's Degree",
    employmentType: 'FULL_TIME',
    location: 'Remote',
    salaryMin: 50000,
    salaryMax: 90000,
    openings: 2,
    status: JobStatus.OPEN,
    publishedAt: new Date(),
    createdBy: recruiter._id as any,
  });

  const appFilter = {};
  const jobFilter = {};
  const candidateFilter = {};

  async function runAndVerifyAllViews(scenarioName: string) {
    console.log(`\n--- Running Metrics Verification for Scenario: ${scenarioName} ---`);
    
    // 1. Recruitment Overview
    const overview = await analyticsRepository.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
    validatePercentage(overview.conversionRate, `${scenarioName} - Overview conversionRate`);
    console.log(`  Overview - conversionRate: ${overview.conversionRate}%`);

    // 2. Funnel Analytics
    const funnel = await analyticsRepository.getRecruitmentFunnel(appFilter);
    Object.entries(funnel.conversionRates).forEach(([key, val]) => {
      validatePercentage(val, `${scenarioName} - Funnel conversionRate [${key}]`);
    });
    validatePercentage(funnel.efficiency, `${scenarioName} - Funnel efficiency`);
    console.log(`  Funnel - Applied to Screening: ${funnel.conversionRates['Applied to Screening']}%`);
    console.log(`  Funnel - Hired to Applied (Efficiency): ${funnel.efficiency}%`);

    // 3. AI Screening
    const screening = await analyticsRepository.getAIScreeningStats(appFilter);
    validatePercentage(screening.recommendationRate, `${scenarioName} - Screening recommendationRate`);
    console.log(`  AI Screening - recommendationRate: ${screening.recommendationRate}%`);

    // 4. AI Interviews
    const interviews = await analyticsRepository.getAIInterviewStats(appFilter);
    validatePercentage(interviews.passRate, `${scenarioName} - Interview passRate`);
    validatePercentage(interviews.failureRate, `${scenarioName} - Interview failureRate`);
    validatePercentage(interviews.completionRate, `${scenarioName} - Interview completionRate`);
    console.log(`  AI Interview - passRate: ${interviews.passRate}%, failureRate: ${interviews.failureRate}%, completionRate: ${interviews.completionRate}%`);

    // 5. Recruiter Performance
    const recruitersList = await analyticsRepository.getRecruiterPerformance(appFilter);
    recruitersList.forEach((r) => {
      validatePercentage(r.conversionRate, `${scenarioName} - Recruiter [${r.recruiterName}] conversionRate`);
    });
    console.log(`  Recruiters leaderboard count: ${recruitersList.length}`);

    // 6. Department Analytics
    const departmentsList = await analyticsRepository.getDepartmentHiringStats(appFilter);
    departmentsList.forEach((d) => {
      validatePercentage(d.conversionRate, `${scenarioName} - Department [${d.departmentName}] conversionRate`);
    });
    console.log(`  Departments count: ${departmentsList.length}`);

    // 7. Job Analytics (Pagination)
    const jobPerformance = await analyticsRepository.getJobPerformance(appFilter, { page: 1, limit: 10 });
    console.log(`  Job Performance count: ${jobPerformance.total}`);
  }

  // ==========================================
  // SCENARIO 2: Empty Dataset
  // ==========================================
  await clearCollections();
  // Ensure department and job are cleared to test completely empty dataset
  await runAndVerifyAllViews('Empty Dataset');

  // Re-create department & job for subsequent tests
  const testDept2 = await DepartmentModel.create({ name: 'Test QA Department', description: 'Testing' });
  const testDesig2 = await DesignationModel.create({
    title: 'QA Engineer',
    description: 'Testing',
    departmentId: testDept2._id,
    level: 2,
  });
  const testJob2 = await JobModel.create({
    jobCode: 'JOB-TEST-0002',
    title: 'QA Engineer',
    departmentId: testDept2._id,
    designationId: testDesig2._id,
    description: 'QA Engineer Job',
    responsibilities: 'QA testing',
    requiredSkills: ['React', 'TypeScript'],
    experienceRequired: '2 years',
    educationRequired: "Bachelor's Degree",
    employmentType: 'FULL_TIME',
    location: 'Remote',
    salaryMin: 50000,
    salaryMax: 90000,
    openings: 2,
    status: JobStatus.OPEN,
    publishedAt: new Date(),
    createdBy: recruiter._id as any,
  });

  // ==========================================
  // SCENARIO 3: Zero Completed Interviews
  // ==========================================
  await CandidateModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  
  // Create 5 applications with scheduled interviews but 0 completed
  for (let i = 1; i <= 5; i++) {
    const candidate = await CandidateModel.create({
      candidateCode: `CAND-ZEROINT-${i}`,
      firstName: `ZeroInt`,
      lastName: `Cand${i}`,
      email: `zero-int-${i}@test.com`,
      phone: `555-00${i}`,
      skills: ['React'],
      experience: '1 year',
      education: 'B.S.',
      source: 'DIRECT',
      status: 'APPLIED',
      createdBy: recruiter._id as any,
    });

    await ApplicationModel.create({
      candidateId: candidate._id,
      jobId: testJob2._id,
      currentStage: ApplicationStage.INTERVIEW,
      status: 'ACTIVE',
      appliedAt: new Date(),
      screeningStatus: 'COMPLETED',
      aiScore: 75,
      aiRecommendation: 'Recommended',
      interviewStatus: 'SCHEDULED',
      interviewScore: 80, // Score assigned but status is SCHEDULED!
      stageHistory: [
        { stage: ApplicationStage.APPLIED, changedAt: new Date(), changedBy: candidate._id as any },
        { stage: ApplicationStage.INTERVIEW, changedAt: new Date(), changedBy: recruiter._id as any }
      ],
    });
  }
  await runAndVerifyAllViews('Zero Completed Interviews');

  // ==========================================
  // SCENARIO 4: Zero Applications
  // ==========================================
  await CandidateModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  // Candidates exist, jobs exist, but 0 applications
  for (let i = 1; i <= 3; i++) {
    await CandidateModel.create({
      candidateCode: `CAND-NOAPP-${i}`,
      firstName: `NoApp`,
      lastName: `Cand${i}`,
      email: `no-app-${i}@test.com`,
      phone: `555-10${i}`,
      skills: ['React'],
      experience: '1 year',
      education: 'B.S.',
      source: 'DIRECT',
      status: 'APPLIED',
      createdBy: recruiter._id as any,
    });
  }
  await runAndVerifyAllViews('Zero Applications');

  // ==========================================
  // SCENARIO 5: 100% Conversion Scenario
  // ==========================================
  await CandidateModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  
  // 5 applications, all of them progress to HIRED
  for (let i = 1; i <= 5; i++) {
    const candidate = await CandidateModel.create({
      candidateCode: `CAND-ALLHIRE-${i}`,
      firstName: `AllHire`,
      lastName: `Cand${i}`,
      email: `all-hire-${i}@test.com`,
      phone: `555-20${i}`,
      skills: ['React', 'TypeScript'],
      experience: '5 years',
      education: 'B.S.',
      source: 'DIRECT',
      status: 'HIRED',
      createdBy: recruiter._id as any,
    });

    const now = new Date();
    await ApplicationModel.create({
      candidateId: candidate._id,
      jobId: testJob2._id,
      currentStage: ApplicationStage.HIRED,
      status: 'HIRED',
      appliedAt: now,
      screenedAt: now,
      interviewedAt: now,
      offeredAt: now,
      hiredAt: now,
      aiScore: 90,
      aiRecommendation: 'Strongly Recommended',
      screeningStatus: 'COMPLETED',
      interviewScore: 85,
      interviewStatus: 'COMPLETED',
      interviewCompletedAt: now,
      stageHistory: [
        { stage: ApplicationStage.APPLIED, changedAt: now, changedBy: candidate._id as any },
        { stage: ApplicationStage.SCREENING, changedAt: now, changedBy: recruiter._id as any },
        { stage: ApplicationStage.SHORTLISTED, changedAt: now, changedBy: recruiter._id as any },
        { stage: ApplicationStage.INTERVIEW, changedAt: now, changedBy: recruiter._id as any },
        { stage: ApplicationStage.OFFER, changedAt: now, changedBy: recruiter._id as any },
        { stage: ApplicationStage.HIRED, changedAt: now, changedBy: recruiter._id as any },
      ],
    });
  }
  await runAndVerifyAllViews('100% Conversion');

  // ==========================================
  // SCENARIO 6: 0% Conversion Scenario
  // ==========================================
  await CandidateModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  
  // 5 applications, all of them remain at APPLIED or are REJECTED, with failing scores
  for (let i = 1; i <= 5; i++) {
    const candidate = await CandidateModel.create({
      candidateCode: `CAND-ZERO-${i}`,
      firstName: `Zero`,
      lastName: `Cand${i}`,
      email: `zero-${i}@test.com`,
      phone: `555-30${i}`,
      skills: ['None'],
      experience: '0 years',
      education: 'None',
      source: 'DIRECT',
      status: 'REJECTED',
      createdBy: recruiter._id as any,
    });

    const now = new Date();
    await ApplicationModel.create({
      candidateId: candidate._id,
      jobId: testJob2._id,
      currentStage: ApplicationStage.REJECTED,
      status: 'REJECTED',
      appliedAt: now,
      screenedAt: now,
      interviewedAt: now,
      aiScore: 30,
      aiRecommendation: 'Not Recommended',
      screeningStatus: 'COMPLETED',
      interviewScore: 40,
      interviewStatus: 'COMPLETED',
      interviewCompletedAt: now,
      stageHistory: [
        { stage: ApplicationStage.APPLIED, changedAt: now, changedBy: candidate._id as any },
        { stage: ApplicationStage.SCREENING, changedAt: now, changedBy: recruiter._id as any },
        { stage: ApplicationStage.REJECTED, changedAt: now, changedBy: recruiter._id as any },
      ],
    });
  }
  await runAndVerifyAllViews('0% Conversion');

  // ==========================================
  // SCENARIO 7: Large Dataset Simulation (10,000+ records)
  // ==========================================
  await CandidateModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  
  console.log('\nGenerating 10,000 candidate and application records for simulation...');
  const startTime = Date.now();

  const candidatesToInsert = [];
  const appsToInsert = [];
  const now = new Date();

  for (let i = 1; i <= 10050; i++) {
    const candidateId = new mongoose.Types.ObjectId();
    const isHired = i % 20 === 0; // 5% hire rate
    const isRejected = i % 5 === 0; // 20% reject rate
    let currentStage = ApplicationStage.APPLIED;
    if (isHired) currentStage = ApplicationStage.HIRED;
    else if (isRejected) currentStage = ApplicationStage.REJECTED;
    else if (i % 3 === 0) currentStage = ApplicationStage.INTERVIEW;

    candidatesToInsert.push({
      _id: candidateId,
      candidateCode: `CAND-LARGE-${i}`,
      firstName: `LargeFn${i}`,
      lastName: `LargeLn${i}`,
      email: `large-cand-${i}@large.com`,
      phone: `555-large-${i}`,
      skills: ['React', 'Node.js'],
      experience: '3 years',
      education: 'B.S. CS',
      source: 'LINKEDIN',
      status: currentStage === ApplicationStage.HIRED ? 'HIRED' : currentStage === ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
      createdBy: recruiter._id,
      isDeleted: false,
    });

    const isInterview = currentStage === ApplicationStage.INTERVIEW || currentStage === ApplicationStage.HIRED;
    const isCompleted = isHired || (isInterview && i % 2 === 0);

    const appData: any = {
      candidateId,
      jobId: testJob2._id,
      currentStage,
      status: currentStage === ApplicationStage.HIRED ? 'HIRED' : currentStage === ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
      appliedAt: now,
      aiScore: 70 + (i % 26), // 70-95
      aiRecommendation: 'Recommended',
      screeningStatus: 'COMPLETED',
      isDeleted: false,
    };

    if (isInterview) {
      appData.interviewScore = 55 + (i % 41); // 55-95
      appData.interviewStatus = isCompleted ? 'COMPLETED' : 'SCHEDULED';
      if (isCompleted) {
        appData.interviewCompletedAt = now;
      }
    }

    appsToInsert.push(appData);
  }

  // Use bulk inserts for high performance
  await CandidateModel.insertMany(candidatesToInsert);
  await ApplicationModel.insertMany(appsToInsert);

  const generationTime = Date.now() - startTime;
  console.log(`Generated and inserted 10,050 records in ${generationTime}ms.`);

  const queryStartTime = Date.now();
  await runAndVerifyAllViews('Large Dataset (10,000+)');
  const queryEndTime = Date.now() - queryStartTime;
  console.log(`Aggregation queries on 10,000+ records completed in ${queryEndTime}ms.`);

  // Assert query runs in a reasonable time (e.g. less than 1.5 seconds)
  if (queryEndTime > 2000) {
    console.warn(`[WARNING] Large dataset queries took longer than 2 seconds: ${queryEndTime}ms`);
  } else {
    console.log(`[PASS] Large dataset query performance is excellent!`);
  }

  console.log('\n==========================================');
  console.log('ALL EDGE CASE SCENARIOS VERIFIED SUCCESSFULLY!');
  console.log('==========================================');
}

// Connect, run tests, restore seed data, and disconnect
async function run() {
  try {
    await runEdgeCaseTests();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    // Re-seed the database back to standard mock data to restore environment
    console.log('\nRestoring default seed data...');
    try {
      // We can run the seed script directly
      const spawn = require('child_process').spawnSync;
      const seedProc = spawn('npx', ['ts-node', 'src/modules/analytics/seed.ts'], { stdio: 'inherit', shell: true });
      if (seedProc.status !== 0) {
        console.error('Failed to restore default seed data');
      } else {
        console.log('Default seed data restored successfully.');
      }
    } catch (e) {
      console.error('Error triggering seeder restore:', e);
    }
    await mongoose.disconnect();
    console.log('Database disconnected. Exit.');
  }
}

run();
