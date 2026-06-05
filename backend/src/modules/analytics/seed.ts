import mongoose from 'mongoose';
import dotenv from 'dotenv';
import JobModel, { JobStatus } from '../../models/Job';
import CandidateModel from '../../models/Candidate';
import ApplicationModel, { ApplicationStage } from '../../models/Application';
import DepartmentModel from '../../models/Department';
import DesignationModel from '../../models/Designation';
import { User as UserModel } from '../../models/User';
import { SystemRoles } from '../../models/roles';

dotenv.config();

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

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDateWithinDays(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgo));
  date.setHours(getRandomInt(0, 23), getRandomInt(0, 59));
  return date;
}

async function seed() {
  console.log('Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  // Clear existing analytical data for clean testing
  console.log('Cleaning old jobs, candidates, and applications...');
  await Promise.all([
    JobModel.deleteMany({}),
    CandidateModel.deleteMany({}),
    ApplicationModel.deleteMany({}),
    DesignationModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
  ]);

  // Fetch or create a Recruiter user
  let recruiter: any = await UserModel.findOne({ role: SystemRoles.HR_RECRUITER });
  if (!recruiter) {
    console.log('Creating a mock HR Recruiter user...');
    recruiter = await UserModel.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.recruiter@bluhire.com',
      employeeId: 'EMP-REC-9999',
      role: SystemRoles.HR_RECRUITER,
      isActive: true,
      passwordHash: '$2b$10$tMh4wUqGkLw3L.kEa6iMHeu/zJjVqIuO8iCq2r5Z.4p6v7z3mP/lG', // password
    });
  }

  let admin: any = await UserModel.findOne({ role: SystemRoles.MANAGEMENT_ADMIN });
  if (!admin) {
    console.log('Creating a mock Management Admin user...');
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

  // Fetch or create Departments & Designations
  console.log('Seeding Departments & Designations...');
  const depts: any[] = [];
  for (const d of DEPARTMENTS) {
    let dept = await DepartmentModel.findOne({ name: d.name });
    if (!dept) {
      dept = await DepartmentModel.create(d);
    }
    depts.push(dept);
  }

  const desigs: any[] = [];
  for (const dept of depts) {
    for (const des of DESIGNATIONS) {
      let desig = await DesignationModel.findOne({ title: des.title, departmentId: dept._id });
      if (!desig) {
        desig = await DesignationModel.create({
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
  const jobs: any[] = [];
  const statusValues = [JobStatus.OPEN, JobStatus.OPEN, JobStatus.CLOSED, JobStatus.DRAFT];

  for (let i = 1; i <= 15; i++) {
    const dept = depts[getRandomInt(0, depts.length - 1)];
    // Filter designations by the chosen department
    const deptDesigs = desigs.filter((d) => d.departmentId.toString() === dept._id.toString());
    const desig = deptDesigs[getRandomInt(0, deptDesigs.length - 1)];
    const requiredSkills = getRandomElements(SKILLS, getRandomInt(3, 6));
    const creator = Math.random() > 0.4 ? recruiter._id : admin._id;

    const job = await JobModel.create({
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
      createdBy: creator as any,
    });
    jobs.push(job);
  }

  // Seed Candidates & Applications
  console.log('Seeding Candidates & Applications...');
  const sources = ['DIRECT', 'LINKEDIN', 'INDEED', 'REFERRAL', 'GLASSDOOR'];
  const recommendations = ['Strongly Recommended', 'Recommended', 'Requires Screen', 'Not Recommended'];
  const applicationStages = [
    ApplicationStage.APPLIED,
    ApplicationStage.SCREENING,
    ApplicationStage.SHORTLISTED,
    ApplicationStage.INTERVIEW,
    ApplicationStage.OFFER,
    ApplicationStage.HIRED,
    ApplicationStage.REJECTED,
  ];

  for (let i = 1; i <= 60; i++) {
    const candidateSkills = getRandomElements(SKILLS, getRandomInt(3, 7));
    const candCreator = Math.random() > 0.5 ? recruiter._id : admin._id;

    const candidate = await CandidateModel.create({
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
      createdBy: candCreator as any,
    });

    // Pick a random job
    const job = jobs[getRandomInt(0, jobs.length - 1)];

    // Determine random stage
    // Bias towards Hired & Rejected for realistic conversion ratios
    const rand = Math.random();
    let currentStage = ApplicationStage.APPLIED;
    if (rand > 0.85) currentStage = ApplicationStage.HIRED;
    else if (rand > 0.6) currentStage = ApplicationStage.REJECTED;
    else if (rand > 0.45) currentStage = ApplicationStage.OFFER;
    else if (rand > 0.3) currentStage = ApplicationStage.INTERVIEW;
    else if (rand > 0.2) currentStage = ApplicationStage.SHORTLISTED;
    else if (rand > 0.1) currentStage = ApplicationStage.SCREENING;

    // Build stage history
    const stageHistory = [];
    const appliedAt = getRandomDateWithinDays(90);
    stageHistory.push({
      stage: ApplicationStage.APPLIED,
      changedAt: appliedAt,
      changedBy: candidate._id as any,
      notes: 'Applied online via career portal.',
    });

    let screenedAt: Date | undefined;
    let interviewedAt: Date | undefined;
    let offeredAt: Date | undefined;
    let hiredAt: Date | undefined;

    const changeUser = Math.random() > 0.5 ? recruiter._id : admin._id;

    if (currentStage !== ApplicationStage.APPLIED) {
      screenedAt = new Date(appliedAt.getTime() + getRandomInt(2, 6) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.SCREENING,
        changedAt: screenedAt,
        changedBy: changeUser as any,
        notes: 'Resume screening process completed.',
      });
    }

    if (
      currentStage !== ApplicationStage.APPLIED &&
      currentStage !== ApplicationStage.SCREENING &&
      currentStage !== ApplicationStage.REJECTED
    ) {
      const shDate = new Date(screenedAt!.getTime() + getRandomInt(2, 5) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.SHORTLISTED,
        changedAt: shDate,
        changedBy: changeUser as any,
        notes: 'Candidate meets core qualifications.',
      });
    }

    if (
      currentStage === ApplicationStage.INTERVIEW ||
      currentStage === ApplicationStage.OFFER ||
      currentStage === ApplicationStage.HIRED
    ) {
      interviewedAt = new Date(screenedAt!.getTime() + getRandomInt(5, 10) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.INTERVIEW,
        changedAt: interviewedAt,
        changedBy: changeUser as any,
        notes: 'Technical panel interview scheduled.',
      });
    }

    if (currentStage === ApplicationStage.OFFER || currentStage === ApplicationStage.HIRED) {
      offeredAt = new Date(interviewedAt!.getTime() + getRandomInt(3, 7) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.OFFER,
        changedAt: offeredAt,
        changedBy: changeUser as any,
        notes: 'Formal employment offer letter sent.',
      });
    }

    if (currentStage === ApplicationStage.HIRED) {
      hiredAt = new Date(offeredAt!.getTime() + getRandomInt(3, 7) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.HIRED,
        changedAt: hiredAt,
        changedBy: changeUser as any,
        notes: 'Offer letter signed. Employee onboarding initiated.',
      });
    }

    if (currentStage === ApplicationStage.REJECTED) {
      const rejectDate = new Date(appliedAt.getTime() + getRandomInt(5, 20) * 24 * 60 * 60 * 1000);
      stageHistory.push({
        stage: ApplicationStage.REJECTED,
        changedAt: rejectDate,
        changedBy: changeUser as any,
        notes: 'Candidate does not meet selection standards.',
      });
    }

    // AI Screening & Interview Scores
    const aiScore = getRandomInt(40, 95);
    const aiRec = aiScore >= 80 ? 'Strongly Recommended' : aiScore >= 65 ? 'Recommended' : aiScore >= 50 ? 'Requires Screen' : 'Not Recommended';

    const hasInterviewScore =
      currentStage === ApplicationStage.INTERVIEW ||
      currentStage === ApplicationStage.OFFER ||
      currentStage === ApplicationStage.HIRED;

    const interviewCompleted = hasInterviewScore && currentStage !== ApplicationStage.INTERVIEW;

    const appData: any = {
      candidateId: candidate._id,
      jobId: job._id,
      currentStage,
      status: currentStage === ApplicationStage.HIRED ? 'HIRED' : currentStage === ApplicationStage.REJECTED ? 'REJECTED' : 'ACTIVE',
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

    if (screenedAt) appData.screenedAt = screenedAt;
    if (interviewedAt) appData.interviewedAt = interviewedAt;
    if (offeredAt) appData.offeredAt = offeredAt;
    if (hiredAt) appData.hiredAt = hiredAt;

    if (hasInterviewScore) {
      appData.interviewScore = getRandomInt(50, 95);
      appData.interviewFeedback = 'Strong analytical skills, solid code architecture comprehension.';
      if (interviewCompleted) {
        appData.interviewStatus = 'COMPLETED';
        appData.interviewCompletedAt = new Date(interviewedAt!.getTime() + 2 * 60 * 60 * 1000);
      } else {
        appData.interviewStatus = 'SCHEDULED';
      }
    }

    await ApplicationModel.create(appData);
  }

  console.log('Database successfully seeded with realistic metrics!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
});
