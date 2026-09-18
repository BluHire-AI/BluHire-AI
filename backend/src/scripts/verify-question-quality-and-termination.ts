import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import InterviewSession from '../models/InterviewSession';
import InterviewQuestion from '../models/InterviewQuestion';
import InterviewResponse from '../models/InterviewResponse';
import Candidate from '../models/Candidate';
import Application from '../models/Application';
import Job from '../models/Job';
import { User } from '../models/User';
import { SystemRoles } from '../models/roles';
import { SessionStatus } from '../types/interview.types';
import { questionGeneratorService } from '../services/question-generator.service';
import { adaptiveQuestionService } from '../services/adaptiveQuestion.service';

async function runQualityAndTerminationTests() {
  console.log('================================================================');
  console.log('🧪 TESTING QUESTION QUALITY & TERMINATION SUITE');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bluhire';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const cleanupIds: {
    jobIds: any[];
    candidateIds: any[];
    applicationIds: any[];
    sessionIds: any[];
    questionIds: any[];
  } = {
    jobIds: [],
    candidateIds: [],
    applicationIds: [],
    sessionIds: [],
    questionIds: [],
  };

  try {
    // Setup recruiter & test job (Data Scientist)
    let recruiter: any = await User.findOne();
    if (!recruiter) {
      recruiter = await User.create({
        firstName: 'Quality',
        lastName: 'Tester',
        email: `tester_${Date.now()}@bluhire.ai`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        role: SystemRoles.HR_RECRUITER,
      });
    }

    const dummyDeptId = new mongoose.Types.ObjectId();
    const dummyDesigId = new mongoose.Types.ObjectId();

    const dsJob: any = await Job.create({
      jobCode: `JOB-DS-${Date.now().toString().slice(-6)}`,
      title: 'Senior Data Scientist - ML Systems',
      description: 'We are seeking a Senior Data Scientist to design machine learning pipelines, evaluate model drift, optimize real-time inference, and query relational data warehouses.',
      requiredSkills: ['Machine Learning', 'Python', 'SQL', 'Model Evaluation'],
      preferredSkills: ['MLOps', 'Feature Engineering'],
      responsibilities: 'Build predictive models, optimize feature pipelines, monitor production inference metrics, and communicate findings to cross-functional partners.',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      educationRequired: "B.S. or M.S. in Computer Science or Statistics",
      experienceRequired: 'Senior',
      departmentId: dummyDeptId,
      designationId: dummyDesigId,
      recruiterId: recruiter._id,
      createdBy: recruiter._id,
      status: 'OPEN',
    });
    cleanupIds.jobIds.push(dsJob._id);

    const candidate: any = await Candidate.create({
      candidateCode: `CAND-${Date.now().toString().slice(-6)}`,
      firstName: 'Alice',
      lastName: 'Wong',
      email: `alice_${Date.now()}@example.com`,
      phone: '+15550001111',
      recruiterId: recruiter._id,
    });
    cleanupIds.candidateIds.push(candidate._id);

    const application: any = await Application.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      status: 'APPLIED',
    });
    cleanupIds.applicationIds.push(application._id);

    // =========================================================================
    // TEST 1 — Question Quality & Length Check
    // =========================================================================
    console.log('\n--- [TEST 1] Spoken-Interview Question Quality & Length ---');
    const session1: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      applicationId: application._id,
      recruiterId: recruiter._id,
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      interviewConfig: { minimumQuestions: 4, targetQuestions: 5, maximumQuestions: 7 },
      publicToken: `token_quality_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(session1._id);

    const competencies = await questionGeneratorService.initializeSessionCompetencies(session1, dsJob);
    console.log(`✅ Competency Plan generated: ${competencies.map(c => c.name).join(', ')}`);

    for (let i = 0; i < 3; i++) {
      const targetComp = competencies[i % competencies.length];
      const q: any = await questionGeneratorService.generateAndSaveNextQuestion(
        session1,
        dsJob,
        targetComp,
        [],
        []
      );
      cleanupIds.questionIds.push(q._id);

      console.log(`\n  Q${i + 1} (${q.competency}): "${q.questionText}"`);
      console.log(`  Length: ${q.questionText.length} characters (Max allowed: 500)`);
      console.log(`  Source Skill: ${q.sourceSkill} | Difficulty: ${q.difficulty}`);

      // Rule 1: Length must not exceed 500 characters
      if (q.questionText.length > 500) {
        throw new Error(`FAILED: Question exceeds 500 characters: ${q.questionText.length}`);
      }

      // Rule 2: Must not contain giant schema definitions
      const badPatterns = [/CREATE TABLE/i, /INT,\s*PRIMARY KEY/i, /DECIMAL\(\d+,\s*\d+\)/i, /VARCHAR\(\d+\)/i];
      for (const pat of badPatterns) {
        if (pat.test(q.questionText)) {
          throw new Error(`FAILED: Question contains raw SQL schema definition: ${pat}`);
        }
      }

      // Rule 3: Must be spoken-interview friendly
      if (q.questionText.toLowerCase().includes('write an entire program') || q.questionText.toLowerCase().includes('write 100 lines')) {
        throw new Error(`FAILED: Question is not spoken-interview friendly.`);
      }
    }
    console.log('\n✅ TEST 1 PASSED: All questions are concise (<500 chars), conversational, and spoken-interview friendly.');

    // =========================================================================
    // TEST 2 — Hard Maximum Termination at Q7 (No Q8 Ever Created)
    // =========================================================================
    console.log('\n--- [TEST 2] Hard Maximum Termination Rule (maxQuestions = 7) ---');
    const session2: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      applicationId: application._id,
      recruiterId: recruiter._id,
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      interviewConfig: { minimumQuestions: 4, targetQuestions: 5, maximumQuestions: 7 },
      publicToken: `token_term_max_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(session2._id);

    // Simulate 7 questions answered
    for (let i = 1; i <= 7; i++) {
      const q = await InterviewQuestion.create({
        sessionId: session2._id,
        jobId: dsJob._id,
        questionText: `Question ${i} for simulation`,
        category: 'TECHNICAL',
        competency: 'Machine Learning',
        difficulty: 'INTERMEDIATE',
        reason: 'Simulation',
        sourceSkill: 'Machine Learning',
        generatedByAI: true,
      });
      cleanupIds.questionIds.push(q._id);

      await InterviewResponse.create({
        sessionId: session2._id,
        questionId: q._id,
        candidateId: candidate._id,
        responseStatus: 'ANSWERED',
        evaluationStatus: 'COMPLETED',
        answeredAt: new Date(),
      });
    }

    const nextAfter7 = await adaptiveQuestionService.selectNextQuestion(session2._id.toString());
    console.log(`   Calling selectNextQuestion after 7 responses -> Result: ${nextAfter7}`);
    if (nextAfter7 !== null) {
      throw new Error(`FAILED: Rule violated! selectNextQuestion generated another question after maximumQuestions (7).`);
    }

    const totalQuestionsInDB = await InterviewQuestion.countDocuments({ sessionId: session2._id });
    console.log(`   Total questions in DB: ${totalQuestionsInDB} (Expected: 7, strictly NO Question 8)`);
    if (totalQuestionsInDB !== 7) {
      throw new Error(`FAILED: Expected 7 questions, found ${totalQuestionsInDB}`);
    }
    console.log('✅ TEST 2 PASSED: Hard termination strictly halts interview at maximumQuestions (7).');

    // =========================================================================
    // TEST 3 — Target Termination at Q5 when High-Importance Satisfied
    // =========================================================================
    console.log('\n--- [TEST 3] Target Termination at Q5 with Competencies Satisfied ---');
    const session3: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      applicationId: application._id,
      recruiterId: recruiter._id,
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      interviewConfig: { minimumQuestions: 4, targetQuestions: 5, maximumQuestions: 7 },
      competencyPlan: [
        { name: 'Machine Learning', importance: 'high', covered: true, coverageScore: 0.85, questionsAsked: 3 },
        { name: 'Python', importance: 'high', covered: true, coverageScore: 0.80, questionsAsked: 2 },
        { name: 'SQL', importance: 'medium', covered: false, coverageScore: 0.0, questionsAsked: 0 },
      ],
      publicToken: `token_target_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(session3._id);

    // Simulate 5 responses
    for (let i = 1; i <= 5; i++) {
      const q = await InterviewQuestion.create({
        sessionId: session3._id,
        jobId: dsJob._id,
        questionText: `Question ${i} for target test`,
        category: 'TECHNICAL',
        competency: 'Machine Learning',
        difficulty: 'INTERMEDIATE',
        reason: 'Simulation',
        sourceSkill: 'Machine Learning',
        generatedByAI: true,
      });
      cleanupIds.questionIds.push(q._id);

      await InterviewResponse.create({
        sessionId: session3._id,
        questionId: q._id,
        candidateId: candidate._id,
        responseStatus: 'ANSWERED',
        evaluationStatus: 'COMPLETED',
        answeredAt: new Date(),
      });
    }

    const nextAfterTarget = await adaptiveQuestionService.selectNextQuestion(session3._id.toString());
    console.log(`   Calling selectNextQuestion after 5 responses with high-importance satisfied -> Result: ${nextAfterTarget}`);
    if (nextAfterTarget !== null) {
      throw new Error(`FAILED: Did not terminate at targetQuestions when all high-importance competencies were satisfied.`);
    }
    console.log('✅ TEST 3 PASSED: Target termination successfully concludes at targetQuestions.');

    // =========================================================================
    // TEST 4 — Minimum Protection at Q1, Q2, Q3 (Never Terminate Early)
    // =========================================================================
    console.log('\n--- [TEST 4] Minimum Questions Protection (minimumQuestions = 4) ---');
    const session4: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      applicationId: application._id,
      recruiterId: recruiter._id,
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      interviewConfig: { minimumQuestions: 4, targetQuestions: 5, maximumQuestions: 7 },
      competencyPlan: [
        { name: 'Machine Learning', importance: 'high', covered: true, coverageScore: 0.95, questionsAsked: 2 },
      ],
      publicToken: `token_min_protect_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(session4._id);

    // Simulate only 2 responses
    for (let i = 1; i <= 2; i++) {
      const q = await InterviewQuestion.create({
        sessionId: session4._id,
        jobId: dsJob._id,
        questionText: `Question ${i} for min protection test`,
        category: 'TECHNICAL',
        competency: 'Machine Learning',
        difficulty: 'INTERMEDIATE',
        reason: 'Simulation',
        sourceSkill: 'Machine Learning',
        generatedByAI: true,
      });
      cleanupIds.questionIds.push(q._id);

      await InterviewResponse.create({
        sessionId: session4._id,
        questionId: q._id,
        candidateId: candidate._id,
        responseStatus: 'ANSWERED',
        evaluationStatus: 'COMPLETED',
        answeredAt: new Date(),
      });
    }

    const nextUnderMin = await adaptiveQuestionService.selectNextQuestion(session4._id.toString());
    console.log(`   Calling selectNextQuestion with only 2 responses -> Result question ID: ${nextUnderMin?._id}`);
    if (nextUnderMin === null) {
      throw new Error(`FAILED: Prematurely terminated before minimumQuestions (4) was met.`);
    }
    cleanupIds.questionIds.push(nextUnderMin._id);
    console.log('✅ TEST 4 PASSED: Interview is protected and continues until minimumQuestions (4).');

    // =========================================================================
    // TEST 5 — Concurrent Requests Deduplication
    // =========================================================================
    console.log('\n--- [TEST 5] Concurrent Request Deduplication ---');
    const session5: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: dsJob._id,
      applicationId: application._id,
      recruiterId: recruiter._id,
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      interviewConfig: { minimumQuestions: 4, targetQuestions: 5, maximumQuestions: 7 },
      publicToken: `token_concurrent_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(session5._id);

    // Fire two selectNextQuestion calls simultaneously
    const [concurrent1, concurrent2] = await Promise.all([
      adaptiveQuestionService.selectNextQuestion(session5._id.toString()),
      adaptiveQuestionService.selectNextQuestion(session5._id.toString()),
    ]);

    if (!concurrent1 || !concurrent2) {
      throw new Error('FAILED: One or both concurrent requests failed.');
    }
    cleanupIds.questionIds.push(concurrent1._id);

    console.log(`   Concurrent call 1 questionId: ${concurrent1._id}`);
    console.log(`   Concurrent call 2 questionId: ${concurrent2._id}`);
    if (concurrent1._id.toString() !== concurrent2._id.toString()) {
      throw new Error(`FAILED: Concurrent requests created two different questions!`);
    }

    const countInDB = await InterviewQuestion.countDocuments({ sessionId: session5._id });
    console.log(`   Questions in DB for session: ${countInDB} (Expected exactly 1)`);
    if (countInDB !== 1) {
      throw new Error(`FAILED: Expected exactly 1 question in DB, got ${countInDB}`);
    }
    console.log('✅ TEST 5 PASSED: Session mutex and active question check prevents duplicate generation.');

    console.log('\n================================================================');
    console.log('🎉 ALL 5 QUESTION QUALITY AND TERMINATION TESTS PASSED!');
    console.log('================================================================\n');

  } finally {
    console.log('🧹 Cleaning up test artifacts...');
    if (cleanupIds.questionIds.length) await InterviewQuestion.deleteMany({ _id: { $in: cleanupIds.questionIds } });
    if (cleanupIds.sessionIds.length) {
      await InterviewSession.deleteMany({ _id: { $in: cleanupIds.sessionIds } });
      await InterviewResponse.deleteMany({ sessionId: { $in: cleanupIds.sessionIds } });
    }
    if (cleanupIds.applicationIds.length) await Application.deleteMany({ _id: { $in: cleanupIds.applicationIds } });
    if (cleanupIds.candidateIds.length) await Candidate.deleteMany({ _id: { $in: cleanupIds.candidateIds } });
    if (cleanupIds.jobIds.length) await Job.deleteMany({ _id: { $in: cleanupIds.jobIds } });
    await mongoose.disconnect();
    console.log('✅ Cleanup complete. Database disconnected.\n');
  }
}

runQualityAndTerminationTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
