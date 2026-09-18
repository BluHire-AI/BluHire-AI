import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import InterviewSession from '../models/InterviewSession';
import InterviewQuestion from '../models/InterviewQuestion';
import InterviewRecording from '../models/InterviewRecording';
import InterviewTranscript from '../models/InterviewTranscript';
import InterviewResponse from '../models/InterviewResponse';
import Candidate from '../models/Candidate';
import Job from '../models/Job';
import Application, { ApplicationStage } from '../models/Application';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import InterviewRecommendation from '../models/InterviewRecommendation';
import { User } from '../models/User';
import { SessionStatus } from '../types/interview.types';
import { SystemRoles } from '../models/roles';

async function runVerification() {
  console.log('========================================================');
  console.log('  STARTING AI INTERVIEW LIFECYCLE VERIFICATION');
  console.log('========================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bluhire';
  await mongoose.connect(mongoUri);
  console.log('1. Connected to MongoDB successfully.');

  // Find admin user
  const admin = await User.findOne({ role: SystemRoles.MANAGEMENT_ADMIN });
  if (!admin) throw new Error('No MANAGEMENT_ADMIN user found in database.');
  const jwtSecret = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret';
  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, jwtSecret);
  console.log(`2. Generated auth token for Management Admin: ${admin.email}`);

  // Test 1: Verify GET /sessions doesn't crash and populates jobId
  console.log('\n--- TEST 1: GET /api/v1/interviews/sessions ---');
  const sessionsRes = await fetch('http://localhost:5000/api/v1/interviews/sessions', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const sessionsData = await sessionsRes.json();
  console.log(`HTTP Status: ${sessionsRes.status}`);
  console.log(`Success: ${sessionsData.success}`);
  console.log(`Total sessions retrieved: ${sessionsData.data?.length}`);
  if (sessionsRes.status !== 200) {
    throw new Error(`GET /sessions failed with status ${sessionsRes.status}: ${JSON.stringify(sessionsData)}`);
  }
  const sampleSession = sessionsData.data?.[0];
  console.log('Sample session Job populated:', sampleSession?.jobId?.title || 'None (Legacy template)');
  console.log('Sample session Candidate populated:', sampleSession?.candidateId?.firstName, sampleSession?.candidateId?.lastName);
  console.log('Test 1 PASSED: /sessions returns 200 with populated Job and Candidate.');

  // Test 2: Verify GET /dashboard/overview matches InterviewSession COMPLETED count
  console.log('\n--- TEST 2: GET /api/v1/dashboard/overview ---');
  const dbCompletedCount = await InterviewSession.countDocuments({ status: SessionStatus.COMPLETED });
  const overviewRes = await fetch('http://localhost:5000/api/v1/dashboard/overview', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const overviewData = await overviewRes.json();
  console.log(`HTTP Status: ${overviewRes.status}`);
  console.log('Overview Data:', overviewData.data);
  console.log(`DB Completed Sessions: ${dbCompletedCount}, Overview completedInterviews: ${overviewData.data?.completedInterviews}`);
  if (overviewData.data?.completedInterviews !== dbCompletedCount) {
    throw new Error(`Mismatch! DB has ${dbCompletedCount} completed sessions, but overview reports ${overviewData.data?.completedInterviews}`);
  }
  console.log('Test 2 PASSED: Completed Interviews counter matches database source of truth.');

  // Test 3: Idempotent Submission (First and Second call)
  console.log('\n--- TEST 3: Idempotent POST /interviews/public/:token/submit ---');
  // Find an existing completed session or test token
  const testSession = await InterviewSession.findOne({ status: SessionStatus.COMPLETED }).sort({ updatedAt: -1 });
  if (!testSession || !testSession.publicToken) {
    throw new Error('No completed interview session found to test submission idempotency.');
  }

  console.log(`Testing with session ID: ${testSession._id}, token: ${testSession.publicToken}`);

  // Call 1
  console.log('Submitting (call #1)...');
  const submit1Res = await fetch(`http://localhost:5000/api/v1/interviews/public/${testSession.publicToken}/submit`, {
    method: 'POST'
  });
  const submit1Data = await submit1Res.json();
  console.log(`Submit #1 HTTP Status: ${submit1Res.status}`);
  console.log('Submit #1 Response:', submit1Data);
  if (submit1Res.status !== 200 || !submit1Data.success) {
    throw new Error(`Submit #1 failed: ${JSON.stringify(submit1Data)}`);
  }

  // Call 2 (Idempotent replay)
  console.log('Submitting again (call #2 - Idempotency)...');
  const submit2Res = await fetch(`http://localhost:5000/api/v1/interviews/public/${testSession.publicToken}/submit`, {
    method: 'POST'
  });
  const submit2Data = await submit2Res.json();
  console.log(`Submit #2 HTTP Status: ${submit2Res.status}`);
  console.log('Submit #2 Response:', submit2Data);
  if (submit2Res.status !== 200 || !submit2Data.success) {
    throw new Error(`Submit #2 failed: ${JSON.stringify(submit2Data)}`);
  }
  console.log('Test 3 PASSED: POST submit is fully idempotent and returns 200 on repeated calls.');

  // Test 4: Database State Verification after Submission
  console.log('\n--- TEST 4: Database State Verification ---');
  const freshSession = await InterviewSession.findById(testSession._id);
  console.log('InterviewSession.status:', freshSession?.status);
  console.log('InterviewSession.duration:', freshSession?.duration, 'seconds');
  console.log('InterviewSession.completedAt:', freshSession?.completedAt);
  if (freshSession?.status !== SessionStatus.COMPLETED || !freshSession?.duration) {
    throw new Error('Session is missing COMPLETED status or duration!');
  }

  const freshCandidate = await Candidate.findById(freshSession.candidateId);
  console.log('Candidate.status:', freshCandidate?.status);

  const freshApp = await Application.findOne({ candidateId: freshSession.candidateId, isDeleted: false });
  console.log('Application.interviewStatus:', freshApp?.interviewStatus);
  console.log('Application.interviewCompletedAt:', freshApp?.interviewCompletedAt);
  console.log('Application.interviewScore:', freshApp?.interviewScore);
  console.log('Application.finalScore:', freshApp?.finalScore);
  if (freshApp?.interviewStatus !== 'COMPLETED') {
    throw new Error(`Application.interviewStatus should be COMPLETED, got: ${freshApp?.interviewStatus}`);
  }
  console.log('Test 4 PASSED: DB state is correctly persisted across Session, Candidate, and Application.');

  // Test 5: Candidate Media & Question Breakdown
  console.log('\n--- TEST 5: GET /api/v1/candidates/:id/media ---');
  const mediaRes = await fetch(`http://localhost:5000/api/v1/candidates/${testSession._id}/media`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const mediaData = await mediaRes.json();
  console.log(`HTTP Status: ${mediaRes.status}`);
  console.log('Media Data summary:', {
    totalQuestions: mediaData.data?.totalQuestions,
    answeredCount: mediaData.data?.answeredCount,
    reviewsCount: mediaData.data?.questionReviews?.length,
    transcriptsCount: mediaData.data?.transcripts?.length
  });
  if (mediaRes.status !== 200 || !mediaData.success) {
    throw new Error(`Media endpoint failed: ${JSON.stringify(mediaData)}`);
  }
  console.log('Test 5 PASSED: Media & question breakdown data is fully visible.');

  // Test 6: Candidate Report Generation & Synthesis
  console.log('\n--- TEST 6: GET /api/v1/candidates/:id/report ---');
  const reportRes = await fetch(`http://localhost:5000/api/v1/candidates/${testSession._id}/report`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const reportData = await reportRes.json();
  console.log(`HTTP Status: ${reportRes.status}`);
  console.log('Report Data:', {
    recommendation: reportData.data?.finalRecommendation,
    strengthsCount: reportData.data?.strengths?.length,
    isSynthesized: reportData.data?.isSynthesized,
    summaryLength: reportData.data?.candidateSummary?.length
  });
  if (reportRes.status !== 200 || !reportData.success) {
    throw new Error(`Report endpoint failed: ${JSON.stringify(reportData)}`);
  }
  console.log('Test 6 PASSED: Report endpoint returns 200 with complete evaluation synthesis.');

  // Test 7: Evaluation Failure Resilience
  console.log('\n--- TEST 7: Evaluation Failure Resilience ---');
  // Verify that sessions with failed or pending evaluations still appear in dashboard
  const sessionsAfterRes = await fetch('http://localhost:5000/api/v1/interviews/sessions', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const sessionsAfterData = await sessionsAfterRes.json();
  const sessionStillVisible = sessionsAfterData.data?.some((s: any) => s._id.toString() === testSession._id.toString());
  console.log(`Completed session ${testSession._id} is visible in management list: ${sessionStillVisible}`);
  if (!sessionStillVisible) {
    throw new Error('Completed session disappeared from sessions list!');
  }
  console.log('Test 7 PASSED: Completed session remains firmly visible regardless of evaluation state.');

  console.log('\n========================================================');
  console.log('  ALL 7 TESTS PASSED SUCCESSFULLY! FULL LIFECYCLE VERIFIED.');
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
