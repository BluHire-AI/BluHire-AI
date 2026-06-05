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
const Job_1 = __importStar(require("../../models/Job"));
const Candidate_1 = __importDefault(require("../../models/Candidate"));
const Application_1 = __importStar(require("../../models/Application"));
const Department_1 = __importDefault(require("../../models/Department"));
const Designation_1 = __importDefault(require("../../models/Designation"));
const User_1 = require("../../models/User");
const roles_1 = require("../../models/roles");
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';
const DEPARTMENTS = [
    { name: 'Engineering', description: 'Software engineering, QA and devops teams' },
    { name: 'Human Resources', description: 'Recruitment, culture, and employee success' },
    { name: 'Product Management', description: 'Product roadmap and design' },
    { name: 'Sales & Marketing', description: 'Customer acquisition and branding' },
    { name: 'Operations', description: 'Business operations and facility management' },
];
const DESIGNATIONS = [
    { title: 'Software Engineer', description: 'Core product developer' },
    { title: 'Senior Software Engineer', description: 'Lead engineer' },
    { title: 'Product Manager', description: 'Product owner' },
    { title: 'HR Associate', description: 'General HR role' },
    { title: 'Account Executive', description: 'Sales execution' },
    { title: 'Operations Specialist', description: 'Operational support' },
];
const SKILLS = [
    'React', 'Node.js', 'TypeScript', 'MongoDB', 'Python', 'Go',
    'Kubernetes', 'Docker', 'AWS', 'System Design', 'Agile',
    'Product Strategy', 'UI/UX', 'SEO', 'Salesforce', 'Negotiation'
];
function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomDateWithinDays(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - getRandomInt(0, daysAgo));
    date.setHours(getRandomInt(0, 23), getRandomInt(0, 59));
    return date;
}
async function seed() {
    console.log('Connecting to database:', mongoUri);
    await mongoose_1.default.connect(mongoUri);
    console.log('Connected!');
    // Clear existing analytical data for clean testing
    console.log('Cleaning old jobs, candidates, and applications...');
    await Promise.all([
        Job_1.default.deleteMany({}),
        Candidate_1.default.deleteMany({}),
        Application_1.default.deleteMany({}),
        Designation_1.default.deleteMany({}),
        Department_1.default.deleteMany({}),
    ]);
    // Fetch or create a Recruiter user
    let recruiter = await User_1.User.findOne({ role: roles_1.SystemRoles.HR_RECRUITER });
    if (!recruiter) {
        console.log('Creating a mock HR Recruiter user...');
        recruiter = await User_1.User.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.recruiter@bluhire.com',
            employeeId: 'EMP-REC-9999',
            role: roles_1.SystemRoles.HR_RECRUITER,
            isActive: true,
            passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG', // password
        });
    }
    let admin = await User_1.User.findOne({ role: roles_1.SystemRoles.MANAGEMENT_ADMIN });
    if (!admin) {
        console.log('Creating a mock Management Admin user...');
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
    // Fetch or create Departments & Designations
    console.log('Seeding Departments & Designations...');
    const depts = [];
    for (const d of DEPARTMENTS) {
        let dept = await Department_1.default.findOne({ name: d.name });
        if (!dept) {
            dept = await Department_1.default.create(d);
        }
        depts.push(dept);
    }
    const desigs = [];
    for (const dept of depts) {
        for (const des of DESIGNATIONS) {
            let desig = await Designation_1.default.findOne({ title: des.title, departmentId: dept._id });
            if (!desig) {
                desig = await Designation_1.default.create({
                    title: des.title,
                    description: des.description,
                    departmentId: dept._id,
                    level: getRandomInt(1, 5),
                });
            }
            desigs.push(desig);
        }
    }
    // Seed Jobs
    console.log('Seeding Jobs...');
    const jobs = [];
    const statusValues = [Job_1.JobStatus.OPEN, Job_1.JobStatus.OPEN, Job_1.JobStatus.CLOSED, Job_1.JobStatus.DRAFT];
    for (let i = 1; i <= 15; i++) {
        const dept = depts[getRandomInt(0, depts.length - 1)];
        // Filter designations by the chosen department
        const deptDesigs = desigs.filter((d) => d.departmentId.toString() === dept._id.toString());
        const desig = deptDesigs[getRandomInt(0, deptDesigs.length - 1)];
        const requiredSkills = getRandomElements(SKILLS, getRandomInt(3, 6));
        const creator = Math.random() > 0.4 ? recruiter._id : admin._id;
        const job = await Job_1.default.create({
            jobCode: `JOB-2026-${i.toString().padStart(4, '0')}`,
            title: `${desig.title} (${dept.name})`,
            departmentId: dept._id,
            designationId: desig._id,
            description: `We are looking for a qualified ${desig.title} to join our growing team.`,
            responsibilities: `Develop and maintain software architectures, collaborate with key stakeholders.`,
            requiredSkills,
            experienceRequired: `${getRandomInt(1, 8)} years`,
            educationRequired: "Bachelor's Degree",
            employmentType: getRandomElements(['FULL_TIME', 'CONTRACT', 'INTERN'], 1)[0],
            location: getRandomElements(['Remote', 'New York', 'San Francisco', 'Chicago'], 1)[0],
            salaryMin: getRandomInt(60, 100) * 1000,
            salaryMax: getRandomInt(110, 180) * 1000,
            openings: getRandomInt(1, 5),
            status: statusValues[getRandomInt(0, statusValues.length - 1)],
            publishedAt: getRandomDateWithinDays(60),
            createdBy: creator,
        });
        jobs.push(job);
    }
    // Seed Candidates & Applications
    console.log('Seeding Candidates & Applications...');
    const sources = ['DIRECT', 'LINKEDIN', 'INDEED', 'REFERRAL', 'GLASSDOOR'];
    const recommendations = ['Strongly Recommended', 'Recommended', 'Requires Screen', 'Not Recommended'];
    const applicationStages = [
        Application_1.ApplicationStage.APPLIED,
        Application_1.ApplicationStage.SCREENING,
        Application_1.ApplicationStage.SHORTLISTED,
        Application_1.ApplicationStage.INTERVIEW,
        Application_1.ApplicationStage.OFFER,
        Application_1.ApplicationStage.HIRED,
        Application_1.ApplicationStage.REJECTED,
    ];
    for (let i = 1; i <= 60; i++) {
        const candidateSkills = getRandomElements(SKILLS, getRandomInt(3, 7));
        const candCreator = Math.random() > 0.5 ? recruiter._id : admin._id;
        const candidate = await Candidate_1.default.create({
            candidateCode: `CAND-2026-${i.toString().padStart(4, '0')}`,
            firstName: `CandidateFirstName${i}`,
            lastName: `CandidateLastName${i}`,
            email: `candidate${i}@gmail.com`,
            phone: `+1-555-${i.toString().padStart(4, '0')}`,
            skills: candidateSkills,
            experience: `${getRandomInt(0, 10)} years`,
            education: 'B.S. in Computer Science',
            source: sources[getRandomInt(0, sources.length - 1)],
            status: 'APPLIED',
            createdBy: candCreator,
        });
        // Pick a random job
        const job = jobs[getRandomInt(0, jobs.length - 1)];
        // Determine random stage
        // Bias towards Hired & Rejected for realistic conversion ratios
        const rand = Math.random();
        let currentStage = Application_1.ApplicationStage.APPLIED;
        if (rand > 0.85)
            currentStage = Application_1.ApplicationStage.HIRED;
        else if (rand > 0.6)
            currentStage = Application_1.ApplicationStage.REJECTED;
        else if (rand > 0.45)
            currentStage = Application_1.ApplicationStage.OFFER;
        else if (rand > 0.3)
            currentStage = Application_1.ApplicationStage.INTERVIEW;
        else if (rand > 0.2)
            currentStage = Application_1.ApplicationStage.SHORTLISTED;
        else if (rand > 0.1)
            currentStage = Application_1.ApplicationStage.SCREENING;
        // Build stage history
        const stageHistory = [];
        const appliedAt = getRandomDateWithinDays(90);
        stageHistory.push({
            stage: Application_1.ApplicationStage.APPLIED,
            changedAt: appliedAt,
            changedBy: candidate._id,
            notes: 'Applied online via career portal.',
        });
        let screenedAt;
        let interviewedAt;
        let offeredAt;
        let hiredAt;
        const changeUser = Math.random() > 0.5 ? recruiter._id : admin._id;
        if (currentStage !== Application_1.ApplicationStage.APPLIED) {
            screenedAt = new Date(appliedAt.getTime() + getRandomInt(2, 6) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.SCREENING,
                changedAt: screenedAt,
                changedBy: changeUser,
                notes: 'Resume screening process completed.',
            });
        }
        if (currentStage !== Application_1.ApplicationStage.APPLIED &&
            currentStage !== Application_1.ApplicationStage.SCREENING &&
            currentStage !== Application_1.ApplicationStage.REJECTED) {
            const shDate = new Date(screenedAt.getTime() + getRandomInt(2, 5) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.SHORTLISTED,
                changedAt: shDate,
                changedBy: changeUser,
                notes: 'Candidate meets core qualifications.',
            });
        }
        if (currentStage === Application_1.ApplicationStage.INTERVIEW ||
            currentStage === Application_1.ApplicationStage.OFFER ||
            currentStage === Application_1.ApplicationStage.HIRED) {
            interviewedAt = new Date(screenedAt.getTime() + getRandomInt(5, 10) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.INTERVIEW,
                changedAt: interviewedAt,
                changedBy: changeUser,
                notes: 'Technical panel interview scheduled.',
            });
        }
        if (currentStage === Application_1.ApplicationStage.OFFER || currentStage === Application_1.ApplicationStage.HIRED) {
            offeredAt = new Date(interviewedAt.getTime() + getRandomInt(3, 7) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.OFFER,
                changedAt: offeredAt,
                changedBy: changeUser,
                notes: 'Formal employment offer letter sent.',
            });
        }
        if (currentStage === Application_1.ApplicationStage.HIRED) {
            hiredAt = new Date(offeredAt.getTime() + getRandomInt(3, 7) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.HIRED,
                changedAt: hiredAt,
                changedBy: changeUser,
                notes: 'Offer letter signed. Employee onboarding initiated.',
            });
        }
        if (currentStage === Application_1.ApplicationStage.REJECTED) {
            const rejectDate = new Date(appliedAt.getTime() + getRandomInt(5, 20) * 24 * 60 * 60 * 1000);
            stageHistory.push({
                stage: Application_1.ApplicationStage.REJECTED,
                changedAt: rejectDate,
                changedBy: changeUser,
                notes: 'Candidate does not meet selection standards.',
            });
        }
        // AI Screening & Interview Scores
        const aiScore = getRandomInt(40, 95);
        const aiRec = aiScore >= 80 ? 'Strongly Recommended' : aiScore >= 65 ? 'Recommended' : aiScore >= 50 ? 'Requires Screen' : 'Not Recommended';
        const hasInterviewScore = currentStage === Application_1.ApplicationStage.INTERVIEW ||
            currentStage === Application_1.ApplicationStage.OFFER ||
            currentStage === Application_1.ApplicationStage.HIRED;
        const interviewCompleted = hasInterviewScore && currentStage !== Application_1.ApplicationStage.INTERVIEW;
        const appData = {
            candidateId: candidate._id,
            jobId: job._id,
            currentStage,
            status: currentStage === Application_1.ApplicationStage.HIRED ? 'HIRED' : currentStage === Application_1.ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
            appliedAt,
            aiScore,
            aiRecommendation: aiRec,
            matchingSkills: getRandomElements(candidateSkills, getRandomInt(1, candidateSkills.length)),
            missingSkills: getRandomElements(job.requiredSkills, getRandomInt(0, 2)),
            screeningSummary: 'AI auto-screening based on profile alignment.',
            screeningStatus: 'COMPLETED',
            recruiterScore: getRandomInt(3, 5),
            stageHistory,
        };
        if (screenedAt)
            appData.screenedAt = screenedAt;
        if (interviewedAt)
            appData.interviewedAt = interviewedAt;
        if (offeredAt)
            appData.offeredAt = offeredAt;
        if (hiredAt)
            appData.hiredAt = hiredAt;
        if (hasInterviewScore) {
            appData.interviewScore = getRandomInt(50, 95);
            appData.interviewFeedback = 'Strong analytical skills, solid code architecture comprehension.';
            if (interviewCompleted) {
                appData.interviewStatus = 'COMPLETED';
                appData.interviewCompletedAt = new Date(interviewedAt.getTime() + 2 * 60 * 60 * 1000);
            }
            else {
                appData.interviewStatus = 'SCHEDULED';
            }
        }
        await Application_1.default.create(appData);
    }
    console.log('Database successfully seeded with realistic metrics!');
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    mongoose_1.default.disconnect();
});
