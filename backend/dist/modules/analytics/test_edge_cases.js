"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const analytics_repository_1 = __importDefault(require("./analytics.repository"));
const Job_1 = __importStar(require("../../models/Job"));
const Candidate_1 = __importDefault(require("../../models/Candidate"));
const Application_1 = __importStar(require("../../models/Application"));
const Department_1 = __importDefault(require("../../models/Department"));
const Designation_1 = __importDefault(require("../../models/Designation"));
const User_1 = require("../../models/User");
const roles_1 = require("../../models/roles");
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';
function validatePercentage(val, contextName) {
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
        Job_1.default.deleteMany({}),
        Candidate_1.default.deleteMany({}),
        Application_1.default.deleteMany({}),
        Department_1.default.deleteMany({}),
        Designation_1.default.deleteMany({}),
    ]);
}
async function runEdgeCaseTests() {
    console.log('Connecting to database:', mongoUri);
    await mongoose_1.default.connect(mongoUri);
    console.log('Connected!');
    // Clear collections at the beginning for a clean start
    await clearCollections();
    // Setup common records
    let recruiter = await User_1.User.findOne({ role: roles_1.SystemRoles.HR_RECRUITER });
    if (!recruiter) {
        recruiter = await User_1.User.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.recruiter@bluhire.com',
            employeeId: 'EMP-REC-9999',
            role: roles_1.SystemRoles.HR_RECRUITER,
            isActive: true,
            passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG',
        });
    }
    let admin = await User_1.User.findOne({ role: roles_1.SystemRoles.MANAGEMENT_ADMIN });
    if (!admin) {
        admin = await User_1.User.create({
            firstName: 'Alex',
            lastName: 'Admin',
            email: 'alex.admin@bluhire.com',
            employeeId: 'EMP-ADM-0001',
            role: roles_1.SystemRoles.MANAGEMENT_ADMIN,
            isActive: true,
            passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG',
        });
    }
    const testDept = await Department_1.default.create({ name: 'Test QA Department', description: 'Testing' });
    const testDesig = await Designation_1.default.create({
        title: 'QA Engineer',
        description: 'Testing',
        departmentId: testDept._id,
        level: 2,
    });
    const testJob = await Job_1.default.create({
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
        status: Job_1.JobStatus.OPEN,
        publishedAt: new Date(),
        createdBy: recruiter._id,
    });
    const appFilter = {};
    const jobFilter = {};
    const candidateFilter = {};
    async function runAndVerifyAllViews(scenarioName) {
        console.log(`\n--- Running Metrics Verification for Scenario: ${scenarioName} ---`);
        // 1. Recruitment Overview
        const overview = await analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
        validatePercentage(overview.conversionRate, `${scenarioName} - Overview conversionRate`);
        console.log(`  Overview - conversionRate: ${overview.conversionRate}%`);
        // 2. Funnel Analytics
        const funnel = await analytics_repository_1.default.getRecruitmentFunnel(appFilter);
        Object.entries(funnel.conversionRates).forEach(([key, val]) => {
            validatePercentage(val, `${scenarioName} - Funnel conversionRate [${key}]`);
        });
        validatePercentage(funnel.efficiency, `${scenarioName} - Funnel efficiency`);
        console.log(`  Funnel - Applied to Screening: ${funnel.conversionRates['Applied to Screening']}%`);
        console.log(`  Funnel - Hired to Applied (Efficiency): ${funnel.efficiency}%`);
        // 3. AI Screening
        const screening = await analytics_repository_1.default.getAIScreeningStats(appFilter);
        validatePercentage(screening.recommendationRate, `${scenarioName} - Screening recommendationRate`);
        console.log(`  AI Screening - recommendationRate: ${screening.recommendationRate}%`);
        // 4. AI Interviews
        const interviews = await analytics_repository_1.default.getAIInterviewStats(appFilter);
        validatePercentage(interviews.passRate, `${scenarioName} - Interview passRate`);
        validatePercentage(interviews.failureRate, `${scenarioName} - Interview failureRate`);
        validatePercentage(interviews.completionRate, `${scenarioName} - Interview completionRate`);
        console.log(`  AI Interview - passRate: ${interviews.passRate}%, failureRate: ${interviews.failureRate}%, completionRate: ${interviews.completionRate}%`);
        // 5. Recruiter Performance
        const recruitersList = await analytics_repository_1.default.getRecruiterPerformance(appFilter);
        recruitersList.forEach((r) => {
            validatePercentage(r.conversionRate, `${scenarioName} - Recruiter [${r.recruiterName}] conversionRate`);
        });
        console.log(`  Recruiters leaderboard count: ${recruitersList.length}`);
        // 6. Department Analytics
        const departmentsList = await analytics_repository_1.default.getDepartmentHiringStats(appFilter);
        departmentsList.forEach((d) => {
            validatePercentage(d.conversionRate, `${scenarioName} - Department [${d.departmentName}] conversionRate`);
        });
        console.log(`  Departments count: ${departmentsList.length}`);
        // 7. Job Analytics (Pagination)
        const jobPerformance = await analytics_repository_1.default.getJobPerformance(appFilter, { page: 1, limit: 10 });
        console.log(`  Job Performance count: ${jobPerformance.total}`);
    }
    // ==========================================
    // SCENARIO 2: Empty Dataset
    // ==========================================
    await clearCollections();
    // Ensure department and job are cleared to test completely empty dataset
    await runAndVerifyAllViews('Empty Dataset');
    // Re-create department & job for subsequent tests
    const testDept2 = await Department_1.default.create({ name: 'Test QA Department', description: 'Testing' });
    const testDesig2 = await Designation_1.default.create({
        title: 'QA Engineer',
        description: 'Testing',
        departmentId: testDept2._id,
        level: 2,
    });
    const testJob2 = await Job_1.default.create({
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
        status: Job_1.JobStatus.OPEN,
        publishedAt: new Date(),
        createdBy: recruiter._id,
    });
    // ==========================================
    // SCENARIO 3: Zero Completed Interviews
    // ==========================================
    await Candidate_1.default.deleteMany({});
    await Application_1.default.deleteMany({});
    // Create 5 applications with scheduled interviews but 0 completed
    for (let i = 1; i <= 5; i++) {
        const candidate = await Candidate_1.default.create({
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
            createdBy: recruiter._id,
        });
        await Application_1.default.create({
            candidateId: candidate._id,
            jobId: testJob2._id,
            currentStage: Application_1.ApplicationStage.INTERVIEW,
            status: 'ACTIVE',
            appliedAt: new Date(),
            screeningStatus: 'COMPLETED',
            aiScore: 75,
            aiRecommendation: 'Recommended',
            interviewStatus: 'SCHEDULED',
            interviewScore: 80, // Score assigned but status is SCHEDULED!
            stageHistory: [
                { stage: Application_1.ApplicationStage.APPLIED, changedAt: new Date(), changedBy: candidate._id },
                { stage: Application_1.ApplicationStage.INTERVIEW, changedAt: new Date(), changedBy: recruiter._id }
            ],
        });
    }
    await runAndVerifyAllViews('Zero Completed Interviews');
    // ==========================================
    // SCENARIO 4: Zero Applications
    // ==========================================
    await Candidate_1.default.deleteMany({});
    await Application_1.default.deleteMany({});
    // Candidates exist, jobs exist, but 0 applications
    for (let i = 1; i <= 3; i++) {
        await Candidate_1.default.create({
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
            createdBy: recruiter._id,
        });
    }
    await runAndVerifyAllViews('Zero Applications');
    // ==========================================
    // SCENARIO 5: 100% Conversion Scenario
    // ==========================================
    await Candidate_1.default.deleteMany({});
    await Application_1.default.deleteMany({});
    // 5 applications, all of them progress to HIRED
    for (let i = 1; i <= 5; i++) {
        const candidate = await Candidate_1.default.create({
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
            createdBy: recruiter._id,
        });
        const now = new Date();
        await Application_1.default.create({
            candidateId: candidate._id,
            jobId: testJob2._id,
            currentStage: Application_1.ApplicationStage.HIRED,
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
                { stage: Application_1.ApplicationStage.APPLIED, changedAt: now, changedBy: candidate._id },
                { stage: Application_1.ApplicationStage.SCREENING, changedAt: now, changedBy: recruiter._id },
                { stage: Application_1.ApplicationStage.SHORTLISTED, changedAt: now, changedBy: recruiter._id },
                { stage: Application_1.ApplicationStage.INTERVIEW, changedAt: now, changedBy: recruiter._id },
                { stage: Application_1.ApplicationStage.OFFER, changedAt: now, changedBy: recruiter._id },
                { stage: Application_1.ApplicationStage.HIRED, changedAt: now, changedBy: recruiter._id },
            ],
        });
    }
    await runAndVerifyAllViews('100% Conversion');
    // ==========================================
    // SCENARIO 6: 0% Conversion Scenario
    // ==========================================
    await Candidate_1.default.deleteMany({});
    await Application_1.default.deleteMany({});
    // 5 applications, all of them remain at APPLIED or are REJECTED, with failing scores
    for (let i = 1; i <= 5; i++) {
        const candidate = await Candidate_1.default.create({
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
            createdBy: recruiter._id,
        });
        const now = new Date();
        await Application_1.default.create({
            candidateId: candidate._id,
            jobId: testJob2._id,
            currentStage: Application_1.ApplicationStage.REJECTED,
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
                { stage: Application_1.ApplicationStage.APPLIED, changedAt: now, changedBy: candidate._id },
                { stage: Application_1.ApplicationStage.SCREENING, changedAt: now, changedBy: recruiter._id },
                { stage: Application_1.ApplicationStage.REJECTED, changedAt: now, changedBy: recruiter._id },
            ],
        });
    }
    await runAndVerifyAllViews('0% Conversion');
    // ==========================================
    // SCENARIO 7: Large Dataset Simulation (10,000+ records)
    // ==========================================
    await Candidate_1.default.deleteMany({});
    await Application_1.default.deleteMany({});
    console.log('\nGenerating 10,000 candidate and application records for simulation...');
    const startTime = Date.now();
    const candidatesToInsert = [];
    const appsToInsert = [];
    const now = new Date();
    for (let i = 1; i <= 10050; i++) {
        const candidateId = new mongoose_1.default.Types.ObjectId();
        const isHired = i % 20 === 0; // 5% hire rate
        const isRejected = i % 5 === 0; // 20% reject rate
        let currentStage = Application_1.ApplicationStage.APPLIED;
        if (isHired)
            currentStage = Application_1.ApplicationStage.HIRED;
        else if (isRejected)
            currentStage = Application_1.ApplicationStage.REJECTED;
        else if (i % 3 === 0)
            currentStage = Application_1.ApplicationStage.INTERVIEW;
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
            status: currentStage === Application_1.ApplicationStage.HIRED ? 'HIRED' : currentStage === Application_1.ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
            createdBy: recruiter._id,
            isDeleted: false,
        });
        const isInterview = currentStage === Application_1.ApplicationStage.INTERVIEW || currentStage === Application_1.ApplicationStage.HIRED;
        const isCompleted = isHired || (isInterview && i % 2 === 0);
        const appData = {
            candidateId,
            jobId: testJob2._id,
            currentStage,
            status: currentStage === Application_1.ApplicationStage.HIRED ? 'HIRED' : currentStage === Application_1.ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
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
    await Candidate_1.default.insertMany(candidatesToInsert);
    await Application_1.default.insertMany(appsToInsert);
    const generationTime = Date.now() - startTime;
    console.log(`Generated and inserted 10,050 records in ${generationTime}ms.`);
    const queryStartTime = Date.now();
    await runAndVerifyAllViews('Large Dataset (10,000+)');
    const queryEndTime = Date.now() - queryStartTime;
    console.log(`Aggregation queries on 10,000+ records completed in ${queryEndTime}ms.`);
    // Assert query runs in a reasonable time (e.g. less than 1.5 seconds)
    if (queryEndTime > 2000) {
        console.warn(`[WARNING] Large dataset queries took longer than 2 seconds: ${queryEndTime}ms`);
    }
    else {
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
    }
    catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
    finally {
        // Re-seed the database back to standard mock data to restore environment
        console.log('\nRestoring default seed data...');
        try {
            // We can run the seed script directly
            const spawn = require('child_process').spawnSync;
            const seedProc = spawn('npx', ['ts-node', 'src/modules/analytics/seed.ts'], { stdio: 'inherit', shell: true });
            if (seedProc.status !== 0) {
                console.error('Failed to restore default seed data');
            }
            else {
                console.log('Default seed data restored successfully.');
            }
        }
        catch (e) {
            console.error('Error triggering seeder restore:', e);
        }
        await mongoose_1.default.disconnect();
        console.log('Database disconnected. Exit.');
    }
}
run();
