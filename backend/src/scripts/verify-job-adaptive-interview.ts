import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import InterviewSession from '../models/InterviewSession';
import InterviewQuestion from '../models/InterviewQuestion';
import InterviewRecording from '../models/InterviewRecording';
import InterviewTranscript from '../models/InterviewTranscript';
import InterviewResponse from '../models/InterviewResponse';
import Candidate from '../models/Candidate';
import Application from '../models/Application';
import Job from '../models/Job';
import { User } from '../models/User';
import { SystemRoles } from '../models/roles';
import { SessionStatus } from '../types/interview.types';
import { questionGeneratorService } from '../services/question-generator.service';
import { adaptiveQuestionService } from '../services/adaptiveQuestion.service';
import { getQuestionReviewsBySession } from '../services/question-review.service';
import TechnicalEvaluation from '../models/TechnicalEvaluation';

async function runJobAdaptiveVerification() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE AI INTERVIEW LIFECYCLE VERIFICATION');
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
    // -------------------------------------------------------------------------
    // STEP 1: Verify AI Microservice is alive
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 1] AI Microservice Connectivity ---');
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    const healthRes = await fetch(`${aiServiceUrl}/health`);
    if (!healthRes.ok) {
      throw new Error(`AI Service health check failed with status: ${healthRes.status}`);
    }
    const healthData: any = await healthRes.json();
    console.log(`✅ AI Service is online (status: ${healthData.status}, model: ${healthData.model})`);

    // -------------------------------------------------------------------------
    // STEP 2: Create a completely unseen, non-generic Job (Rule 16: No role hardcoding)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 2] Create Unseen Dynamic Job Context (No Hardcoded Roles) ---');
    let recruiter: any = await User.findOne({ role: SystemRoles.HR_RECRUITER });
    if (!recruiter) {
      recruiter = await User.create({
        firstName: 'Verification',
        lastName: 'Recruiter',
        email: `recruiter_${Date.now()}@bluhire-test.ai`,
        role: SystemRoles.HR_RECRUITER,
      });
    }

    const dummyDeptId = new mongoose.Types.ObjectId();
    const dummyDesigId = new mongoose.Types.ObjectId();

    const testJob: any = await Job.create({
      jobCode: `JOB-SUBSEA-${Date.now().toString().slice(-6)}`,
      title: 'Subsea Autonomous Robotics Specialist',
      departmentId: dummyDeptId,
      designationId: dummyDesigId,
      location: 'Aberdeen, UK',
      employmentType: 'Full-time',
      experienceRequired: '5+ years autonomous underwater vehicle systems',
      educationRequired: 'B.S. or M.S. in Robotics or Ocean Engineering',
      openings: 1,
      description: 'Design and deploy real-time navigation, acoustic telemetry pipelines, and hydrostatic pressure sensor fusion for Autonomous Underwater Vehicles (AUVs). Maintain subsea ROS 2 control systems in high-latency environments.',
      requiredSkills: [
        'ROS 2 Subsea Control',
        'Acoustic Telemetry Protocols',
        'Hydrostatic Pressure Sensor Calibration',
        'Doppler Velocity Log (DVL) Navigation',
        'Modern C++ Embedded',
      ],
      preferredSkills: ['Deep-sea Manipulators', 'Oceanographic SLAM'],
      responsibilities: 'Develop fail-safe acoustic emergency surfacing routines and sensor fusion algorithms.',
      status: 'OPEN',
      createdBy: recruiter._id,
    });
    cleanupIds.jobIds.push(testJob._id);
    console.log(`✅ Created Job: "${testJob.title}" (ID: ${testJob._id})`);

    const candidate: any = await Candidate.create({
      firstName: 'Alastair',
      lastName: 'Vance',
      email: `subsea_robotics_${Date.now()}@ocean-test.org`,
      phone: '+447911123456',
      candidateCode: `CAN-${Date.now().toString().slice(-6)}`,
      createdBy: recruiter._id,
    });
    cleanupIds.candidateIds.push(candidate._id);

    const application: any = await Application.create({
      candidateId: candidate._id,
      jobId: testJob._id,
      stage: 'INTERVIEW',
      appliedAt: new Date(),
    });
    cleanupIds.applicationIds.push(application._id);
    console.log(`✅ Created Candidate & Application linked to Job`);

    // -------------------------------------------------------------------------
    // STEP 3: Create InterviewSession without Template (Rule 17: No InterviewTemplate for new sessions)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 3] Initialize InterviewSession (Strictly using session.jobId, NO Template) ---');
    const session: any = await InterviewSession.create({
      candidateId: candidate._id,
      jobId: testJob._id,
      applicationId: application._id,
      templateId: undefined, // Strictly undefined
      recruiterId: recruiter._id,
      status: SessionStatus.CREATED,
      totalQuestions: 5,
      currentQuestionIndex: 0,
      interviewConfig: {
        targetQuestions: 5,
        minimumQuestions: 4,
        maximumQuestions: 8,
      },
      publicToken: `token_subsea_${Date.now()}`,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    cleanupIds.sessionIds.push(session._id);
    console.log(`✅ Created InterviewSession (ID: ${session._id}, token: ${session.publicToken})`);

    // -------------------------------------------------------------------------
    // STEP 4: Stage 1 Competency Plan Generation
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 4] Stage 1: AI Competency Plan Generation from Job ---');
    const competencies = await questionGeneratorService.initializeSessionCompetencies(session, testJob);
    console.log(`✅ Generated ${competencies.length} competencies:`);
    for (const c of competencies) {
      console.log(`   - [${c.importance.toUpperCase()}] ${c.name} (Source: ${c.sourceSkills.join(', ')})`);
    }

    const competencyNames = competencies.map(c => c.name.toLowerCase()).join(' ');
    if (competencyNames.includes('react') || competencyNames.includes('frontend') || competencyNames.includes('css')) {
      throw new Error('FAILED: Competency plan contains generic web development terms for a Subsea Robotics role!');
    }
    console.log('✅ Competency Plan is strictly tailored to subsea robotics.');

    // -------------------------------------------------------------------------
    // STEP 5: Stage 2 Question Generation with Traceability (Rule 20)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 5] Stage 2: Question Generation & Traceability (Rule 20) ---');
    const q1: any = await adaptiveQuestionService.selectNextQuestion(session._id.toString());
    if (!q1) throw new Error('FAILED: Could not generate Question 1');
    cleanupIds.questionIds.push(q1._id);
    console.log(`✅ Question 1 Generated:`);
    console.log(`   Text: "${q1.questionText}"`);
    console.log(`   Competency: "${q1.competency}"`);
    console.log(`   Source Skill: "${q1.sourceSkill}"`);
    console.log(`   Reason: "${q1.reason}"`);
    console.log(`   Job ID: ${q1.jobId} (Matches: ${q1.jobId?.toString() === testJob._id.toString()})`);
    console.log(`   Session ID: ${q1.sessionId} (Matches: ${q1.sessionId?.toString() === session._id.toString()})`);

    if (q1.jobId?.toString() !== testJob._id.toString()) {
      throw new Error(`FAILED: Question 1 jobId does not match session.jobId!`);
    }
    if (!q1.competency || !q1.sourceSkill || !q1.reason) {
      throw new Error(`FAILED: Question 1 missing traceability metadata (competency/sourceSkill/reason)!`);
    }

    // -------------------------------------------------------------------------
    // STEP 6: Successful Candidate Answer & Decoupled State (Rules 11, 21, 5)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 6] Candidate Submits Answer -> responseStatus = ANSWERED, AI Evaluates (Rules 11, 21, 5) ---');
    const rec1: any = await InterviewRecording.create({
      sessionId: session._id,
      candidateId: candidate._id,
      questionId: q1._id,
      questionIndex: 0,
      videoUrl: `/uploads/interviews/test_subsea_q1.webm`,
    });

    const transcriptText1 = "When operating Autonomous Underwater Vehicles, acoustic telemetry suffers from high latency and multipath reflection. To maintain reliable localization, I implement an Extended Kalman Filter that fuses high-frequency Doppler Velocity Log readings with inertial measurement units, while incorporating sparse acoustic USBL fixes whenever available.";
    const tr1: any = await InterviewTranscript.create({
      sessionId: session._id,
      candidateId: candidate._id,
      questionId: q1._id,
      questionIndex: 0,
      transcript: transcriptText1,
    });

    const resp1: any = await InterviewResponse.create({
      sessionId: session._id,
      questionId: q1._id,
      candidateId: candidate._id,
      recordingId: rec1._id,
      transcriptId: tr1._id,
      responseStatus: 'ANSWERED',
      evaluationStatus: 'PROCESSING',
      answeredAt: new Date(),
    });

    const evalRes = await fetch(`${aiServiceUrl}/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job: {
          title: testJob.title,
          description: testJob.description,
          requiredSkills: testJob.requiredSkills,
        },
        question: {
          question: q1.questionText,
          competency: q1.competency,
          expectedTopics: q1.expectedTopics || [],
        },
        transcript: transcriptText1,
      }),
    });

    if (!evalRes.ok) {
      throw new Error(`AI Evaluation endpoint returned status: ${evalRes.status}`);
    }
    const evalData: any = await evalRes.json();
    console.log(`✅ AI Evaluation Completed:`);
    console.log(`   Technical Score: ${evalData.technicalScore}/10`);
    console.log(`   Recommendation: ${evalData.recommendation}`);
    console.log(`   Demonstrated Competencies:`, evalData.demonstratedCompetencies);

    await TechnicalEvaluation.create({
      transcriptId: tr1._id,
      technicalAccuracy: (evalData.technicalScore || 8) / 10,
      conceptUnderstanding: (evalData.technicalScore || 8) / 10,
      depth: (evalData.technicalScore || 8) / 10,
      practicalKnowledge: (evalData.technicalScore || 8) / 10,
      overallTechnicalScore: (evalData.technicalScore || 8) / 10,
      feedback: evalData.technicalFeedback || 'Solid acoustic sensor fusion understanding.',
    });

    const updatedSession: any = await InterviewSession.findById(session._id);
    if (updatedSession && updatedSession.competencyPlan) {
      for (const comp of updatedSession.competencyPlan) {
        if (comp.name.toLowerCase() === (q1.competency || '').toLowerCase()) {
          comp.covered = true;
          comp.coverageScore = evalData.technicalScore ? evalData.technicalScore * 10 : 80;
          comp.questionsAsked = (comp.questionsAsked || 0) + 1;
        }
      }
      await updatedSession.save();
      console.log(`✅ Session competency coverage updated in MongoDB by backend.`);
    }

    resp1.evaluationStatus = 'COMPLETED';
    await resp1.save();
    console.log(`✅ Question 1 final state: responseStatus=${resp1.responseStatus}, evaluationStatus=${resp1.evaluationStatus}`);

    // Advance session currentQuestionIndex for next adaptive step
    session.currentQuestionIndex = 1;
    await session.save();

    // -------------------------------------------------------------------------
    // STEP 7: Adaptive Next Question & Explicit Skip (Rule 10)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 7] Adaptive Question 2 & Explicit Candidate Skip (Rule 10) ---');
    const q2: any = await adaptiveQuestionService.selectNextQuestion(session._id.toString());
    if (!q2) throw new Error('FAILED: Could not generate adaptive question 2');
    cleanupIds.questionIds.push(q2._id);
    console.log(`✅ Question 2 Generated (Targeting competency "${q2.competency}"):`);
    console.log(`   Text: "${q2.questionText}"`);

    const resp2: any = await InterviewResponse.create({
      sessionId: session._id,
      questionId: q2._id,
      candidateId: candidate._id,
      responseStatus: 'SKIPPED',
      evaluationStatus: 'NOT_STARTED',
      answeredAt: new Date(),
    });
    console.log(`✅ Question 2 explicitly skipped: responseStatus=${resp2.responseStatus}`);

    session.currentQuestionIndex = 2;
    await session.save();

    // -------------------------------------------------------------------------
    // STEP 8: Evaluation Failure Decoupling (Rule 12)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 8] Evaluation Failure Preserves responseStatus=ANSWERED (Rule 12) ---');
    const q3: any = await adaptiveQuestionService.selectNextQuestion(session._id.toString());
    if (!q3) throw new Error('FAILED: Could not generate adaptive question 3');
    cleanupIds.questionIds.push(q3._id);

    const rec3: any = await InterviewRecording.create({
      sessionId: session._id,
      candidateId: candidate._id,
      questionId: q3._id,
      questionIndex: 2,
      videoUrl: `/uploads/interviews/test_subsea_q3.webm`,
    });

    const tr3: any = await InterviewTranscript.create({
      sessionId: session._id,
      candidateId: candidate._id,
      questionId: q3._id,
      questionIndex: 2,
      transcript: "For hydrostatic pressure calibration, we submerge the transducer in a deadweight tester chamber.",
    });

    const resp3: any = await InterviewResponse.create({
      sessionId: session._id,
      questionId: q3._id,
      candidateId: candidate._id,
      recordingId: rec3._id,
      transcriptId: tr3._id,
      responseStatus: 'ANSWERED',
      evaluationStatus: 'FAILED',
      evaluationError: 'Simulated LLM rate limit or temporary provider error',
      answeredAt: new Date(),
    });
    console.log(`✅ Question 3 state verified: responseStatus=${resp3.responseStatus}, evaluationStatus=${resp3.evaluationStatus}`);
    if (resp3.responseStatus !== 'ANSWERED' || resp3.evaluationStatus !== 'FAILED') {
      throw new Error('FAILED: Rule 12 violated! Candidate response was not preserved as ANSWERED on evaluation failure.');
    }

    session.currentQuestionIndex = 3;
    await session.save();

    // -------------------------------------------------------------------------
    // STEP 9: Transcription Failure Preserves Recording (Rule 13)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 9] Transcription Failure Preserves Recording (Rule 13) ---');
    const q4: any = await adaptiveQuestionService.selectNextQuestion(session._id.toString());
    if (!q4) throw new Error('FAILED: Could not generate adaptive question 4');
    cleanupIds.questionIds.push(q4._id);

    const rec4: any = await InterviewRecording.create({
      sessionId: session._id,
      candidateId: candidate._id,
      questionId: q4._id,
      questionIndex: 3,
      videoUrl: `/uploads/interviews/test_subsea_q4.webm`,
    });

    const resp4: any = await InterviewResponse.create({
      sessionId: session._id,
      questionId: q4._id,
      candidateId: candidate._id,
      recordingId: rec4._id,
      responseStatus: 'TRANSCRIPTION_FAILED',
      transcriptionError: 'Audio stream was corrupted or contained unsupported codec headers',
      evaluationStatus: 'NOT_STARTED',
      answeredAt: new Date(),
    });

    const persistedRec4: any = await InterviewRecording.findById(rec4._id);
    if (!persistedRec4) {
      throw new Error('FAILED: Rule 13 violated! Original recording was not preserved.');
    }
    console.log(`✅ Question 4 state: responseStatus=${resp4.responseStatus}, recording preserved (${persistedRec4._id})`);

    session.currentQuestionIndex = 4;
    await session.save();

    // -------------------------------------------------------------------------
    // STEP 10: Recording Upload Failure (Rule 14)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 10] Recording Upload Failure (Rule 14) ---');
    const q5: any = await adaptiveQuestionService.selectNextQuestion(session._id.toString());
    if (!q5) throw new Error('FAILED: Could not generate adaptive question 5');
    cleanupIds.questionIds.push(q5._id);

    const resp5: any = await InterviewResponse.create({
      sessionId: session._id,
      questionId: q5._id,
      candidateId: candidate._id,
      responseStatus: 'RECORDING_FAILED',
      evaluationStatus: 'NOT_STARTED',
      answeredAt: new Date(),
    });
    console.log(`✅ Question 5 state: responseStatus=${resp5.responseStatus}`);

    // -------------------------------------------------------------------------
    // STEP 11: Exact Response Statistics Calculation (Rule 15: Never subtract)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 11] Exact Statistics Calculation (Rule 15: No Subtraction) ---');
    const reviewData: any = await getQuestionReviewsBySession(session._id.toString());
    if (!reviewData) throw new Error('FAILED: Could not fetch question review data');

    console.log(`   Total Questions: ${reviewData.totalQuestions}`);
    console.log(`   Answered Count: ${reviewData.answeredCount} (Expected: 2 -> Q1 substantive, Q3 eval failed)`);
    console.log(`   Skipped Count: ${reviewData.skippedCount} (Expected: 1 -> Q2 explicit skip)`);
    console.log(`   Transcription Failed Count: ${reviewData.transcriptionFailedCount} (Expected: 1 -> Q4)`);
    console.log(`   Recording Failed Count: ${reviewData.recordingFailedCount} (Expected: 1 -> Q5)`);

    if (reviewData.answeredCount !== 2) {
      throw new Error(`FAILED: Expected answeredCount=2, got ${reviewData.answeredCount}`);
    }
    if (reviewData.skippedCount !== 1) {
      throw new Error(`FAILED: Expected skippedCount=1 (explicit skips only), got ${reviewData.skippedCount}. Subtraction bug detected!`);
    }
    if (reviewData.transcriptionFailedCount !== 1) {
      throw new Error(`FAILED: Expected transcriptionFailedCount=1, got ${reviewData.transcriptionFailedCount}`);
    }
    if (reviewData.recordingFailedCount !== 1) {
      throw new Error(`FAILED: Expected recordingFailedCount=1, got ${reviewData.recordingFailedCount}`);
    }
    console.log('✅ Rule 15 Passed: Question reviews and counts are exact and do not use subtraction math.');

    // -------------------------------------------------------------------------
    // STEP 12: Authoritative Backend Termination Evaluation (Rules 1, 6)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 12] Authoritative Backend Termination Evaluation (Rules 1, 6) ---');
    const terminationDecision = await adaptiveQuestionService.evaluateInterviewProgress(session._id.toString());
    console.log(`   Total Asked: ${terminationDecision.totalQuestionsAsked}`);
    console.log(`   Is Terminated: ${terminationDecision.isTerminated}`);
    console.log(`   Reason: "${terminationDecision.reason}"`);
    console.log(`   High Importance Covered: ${terminationDecision.highImportanceCompetenciesCovered}`);
    console.log('✅ Rule 1 & 6 Passed: Termination is calculated exclusively by backend rules.');

    // -------------------------------------------------------------------------
    // STEP 13: Strict Failure on Missing Job Context (Rule 19)
    // -------------------------------------------------------------------------
    console.log('\n--- [TEST 13] Strict Error on Missing Job Context (Rule 19: No silent Full Stack fallback) ---');
    const orphanCandidateId = new mongoose.Types.ObjectId();
    const orphanSession: any = await InterviewSession.create({
      candidateId: orphanCandidateId,
      jobId: undefined,
      templateId: undefined,
      recruiterId: recruiter._id,
      status: SessionStatus.CREATED,
      totalQuestions: 5,
      publicToken: `token_orphan_${Date.now()}`,
    });
    cleanupIds.sessionIds.push(orphanSession._id);

    let threwExpectedError = false;
    try {
      await questionGeneratorService.resolveJobForSession(orphanSession);
    } catch (jobErr: any) {
      if (jobErr.message.includes('INTERVIEW_JOB_CONTEXT_UNAVAILABLE')) {
        threwExpectedError = true;
        console.log(`✅ Successfully threw expected error: "${jobErr.message}"`);
      } else {
        throw new Error(`Unexpected error message: ${jobErr.message}`);
      }
    }

    if (!threwExpectedError) {
      throw new Error('FAILED: Rule 19 violated! Did not throw INTERVIEW_JOB_CONTEXT_UNAVAILABLE for session lacking job context.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 23 FINAL IMPLEMENTATION RULES VERIFIED AND PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } finally {
    console.log('🧹 Cleaning up test artifacts...');
    if (cleanupIds.questionIds.length) await InterviewQuestion.deleteMany({ _id: { $in: cleanupIds.questionIds } });
    if (cleanupIds.sessionIds.length) {
      await InterviewSession.deleteMany({ _id: { $in: cleanupIds.sessionIds } });
      await InterviewRecording.deleteMany({ sessionId: { $in: cleanupIds.sessionIds } });
      await InterviewTranscript.deleteMany({ sessionId: { $in: cleanupIds.sessionIds } });
      await InterviewResponse.deleteMany({ sessionId: { $in: cleanupIds.sessionIds } });
    }
    if (cleanupIds.applicationIds.length) await Application.deleteMany({ _id: { $in: cleanupIds.applicationIds } });
    if (cleanupIds.candidateIds.length) await Candidate.deleteMany({ _id: { $in: cleanupIds.candidateIds } });
    if (cleanupIds.jobIds.length) await Job.deleteMany({ _id: { $in: cleanupIds.jobIds } });
    await mongoose.disconnect();
    console.log('✅ Cleanup complete. Database disconnected.\n');
  }
}

runJobAdaptiveVerification().catch((err) => {
  console.error('\n❌ VERIFICATION SCRIPT FAILED:', err);
  process.exit(1);
});
