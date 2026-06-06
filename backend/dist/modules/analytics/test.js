"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const analytics_repository_1 = __importDefault(require("./analytics.repository"));
const Job_1 = __importDefault(require("../../models/Job"));
const User_1 = require("../../models/User");
const roles_1 = require("../../models/roles");
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';
async function runTests() {
    console.log('Connecting to database for analytics tests:', mongoUri);
    await mongoose_1.default.connect(mongoUri);
    console.log('Connected!');
    // Fetch users to construct filter contexts
    const admin = await User_1.User.findOne({ role: roles_1.SystemRoles.MANAGEMENT_ADMIN });
    const recruiter = await User_1.User.findOne({ role: roles_1.SystemRoles.HR_RECRUITER });
    if (!recruiter || !admin) {
        console.error('ERROR: Seed users not found. Run seed script first: npx ts-node src/modules/analytics/seed.ts');
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
    console.log('Using Admin User:', admin.email);
    console.log('Using Recruiter User:', recruiter.email);
    // Define filters
    const adminAppFilter = {};
    const adminJobFilter = {};
    const adminCandidateFilter = {};
    // For recruiter, find jobs they created
    const recruiterJobs = await Job_1.default.find({ createdBy: recruiter._id, isDeleted: false }, '_id');
    const recruiterJobIds = recruiterJobs.map((j) => j._id);
    const recruiterAppFilter = { jobId: { $in: recruiterJobIds } };
    const recruiterJobFilter = { createdBy: recruiter._id };
    console.log('--------------------------------------------------');
    console.log('1. Testing Recruitment Overview...');
    const adminOverview = await analytics_repository_1.default.getRecruitmentOverview(adminAppFilter, adminJobFilter, adminCandidateFilter);
    console.log('Admin Overview:', adminOverview);
    const recOverview = await analytics_repository_1.default.getRecruitmentOverview(recruiterAppFilter, recruiterJobFilter, {});
    console.log('Recruiter Overview:', recOverview);
    if (typeof adminOverview.totalApplications !== 'number' || typeof recOverview.totalApplications !== 'number') {
        throw new Error('Overview stats totalApplications must be a number');
    }
    console.log('--------------------------------------------------');
    console.log('2. Testing Funnel Analytics...');
    const adminFunnel = await analytics_repository_1.default.getRecruitmentFunnel(adminAppFilter);
    console.log('Admin Funnel Counts:', adminFunnel.counts);
    console.log('Admin Funnel Conversion Rates:', adminFunnel.conversionRates);
    console.log('Admin Funnel Efficiency:', adminFunnel.efficiency);
    if (typeof adminFunnel.efficiency !== 'number') {
        throw new Error('Funnel efficiency must be a number');
    }
    console.log('--------------------------------------------------');
    console.log('3. Testing AI Screening Analytics...');
    const screening = await analytics_repository_1.default.getAIScreeningStats(adminAppFilter);
    console.log('AI Screening Stats:', {
        totalScreened: screening.totalScreened,
        averageMatchScore: screening.averageMatchScore,
        recommended: screening.recommended,
        scoreDistribution: screening.scoreDistribution,
    });
    if (typeof screening.averageMatchScore !== 'number') {
        throw new Error('AI screening average match score must be a number');
    }
    console.log('--------------------------------------------------');
    console.log('4. Testing AI Interview Analytics...');
    const interviews = await analytics_repository_1.default.getAIInterviewStats(adminAppFilter);
    console.log('AI Interview Stats:', {
        scheduled: interviews.interviewsScheduled,
        completed: interviews.interviewsCompleted,
        averageScore: interviews.averageInterviewScore,
        passRate: interviews.passRate,
        topCandidatesCount: interviews.topPerformingCandidates.length,
    });
    if (interviews.topPerformingCandidates.length > 0) {
        console.log('Top Candidate Preview:', interviews.topPerformingCandidates[0]);
    }
    console.log('--------------------------------------------------');
    console.log('5. Testing Recruiter Performance Leaderboard...');
    const recruitersList = await analytics_repository_1.default.getRecruiterPerformance(adminAppFilter);
    console.log('Recruiters Performance Leaderboard Count:', recruitersList.length);
    if (recruitersList.length > 0) {
        console.log('Leaderboard Ranked #1:', recruitersList[0]);
    }
    console.log('--------------------------------------------------');
    console.log('6. Testing Department Analytics...');
    const departmentsList = await analytics_repository_1.default.getDepartmentHiringStats(adminAppFilter);
    console.log('Departments Stats:', departmentsList);
    console.log('--------------------------------------------------');
    console.log('7. Testing Job Performance (Pagination)...');
    const jobPerformance = await analytics_repository_1.default.getJobPerformance(adminAppFilter, { page: 1, limit: 3 });
    console.log('Job Performance Pagination total count:', jobPerformance.total);
    console.log('Job Performance Data length:', jobPerformance.data.length);
    console.log('--------------------------------------------------');
    console.log('8. Testing Skills Intelligence...');
    const skills = await analytics_repository_1.default.getSkillsIntelligence(adminJobFilter, adminCandidateFilter);
    console.log('Top Requested Skills:', skills.requestedSkills.slice(0, 5));
    console.log('Top Available Skills:', skills.availableSkills.slice(0, 5));
    console.log('Emerging Skills Count:', skills.emerging.length);
    console.log('Skill Gap shortages count:', skills.shortages.length);
    console.log('--------------------------------------------------');
    console.log('9. Testing Activity Trends...');
    const activity = await analytics_repository_1.default.getRecruitmentActivityStats(adminAppFilter);
    console.log('Daily entries:', activity.daily.length);
    console.log('Monthly entries:', activity.monthly.length);
    console.log('Hiring velocity:', activity.recruitmentVelocity);
    console.log('--------------------------------------------------');
    console.log('ALL MONGOOSE AGGREGATION PIPELINES VERIFIED SUCCESSFULLY!');
    await mongoose_1.default.disconnect();
}
runTests().catch((err) => {
    console.error('Test run failed:', err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
