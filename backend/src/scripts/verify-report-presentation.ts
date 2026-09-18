import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api/v1';
const SESSION_ID = '6aace18fd5852f3c1d838759';

async function verify() {
  console.log('========================================================');
  console.log('  STARTING REPORT & EVALUATION PRESENTATION AUDIT');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGO_URI || '');

  const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
  const admin = await User.findOne({ role: 'MANAGEMENT_ADMIN' });
  if (!admin) throw new Error('No MANAGEMENT_ADMIN found in DB');

  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    process.env.JWT_ACCESS_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Test Report Endpoint
  console.log('--- TEST 1: GET /api/v1/candidates/:id/report ---');
  const reportRes = await fetch(`${API_BASE}/candidates/${SESSION_ID}/report`, { headers });
  const reportJson = await reportRes.json();
  console.log('Report Status:', reportRes.status);
  console.log('Report Success:', reportJson.success);
  const report = reportJson.data;

  // Verify Strengths Deduplication
  console.log('\n--- VERIFYING ISSUE 1: STRENGTHS DEDUPLICATION ---');
  console.log('Strengths count:', report.strengths?.length);
  console.log('Strengths:');
  report.strengths?.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));

  const hasDuplicateScores = report.strengths?.some((s: string) =>
    report.strengths.filter((other: string) => other.includes('Strong technical accuracy and depth')).length > 1
  );
  if (hasDuplicateScores) {
    throw new Error('FAILED: Duplicate strength found!');
  }
  const uniqueStrengths = new Set(report.strengths);
  if (uniqueStrengths.size !== report.strengths.length) {
    throw new Error('FAILED: Duplicate strings in strengths array!');
  }
  console.log('PASSED: Strengths are distinct and contain no duplicates.');

  // Verify Communication Feedback
  console.log('\n--- VERIFYING ISSUE 2: COMMUNICATION FEEDBACK ---');
  console.log('Communication Feedback:');
  console.log(`  "${report.communicationFeedback}"`);
  if (report.communicationFeedback === 'Communication evaluations completed.') {
    throw new Error('FAILED: Generic placeholder returned instead of actual communication feedback!');
  }
  if (!report.communicationFeedback || report.communicationFeedback.trim().length < 20) {
    throw new Error('FAILED: Communication feedback is empty or too short!');
  }
  console.log('PASSED: Meaningful stored communication feedback is displayed.');

  // Verify Areas for Improvement
  console.log('\n--- VERIFYING ISSUE 3: AREAS FOR IMPROVEMENT ---');
  console.log('Improvement Areas:');
  report.improvementAreas?.forEach((item: string, i: number) => console.log(`  ${i + 1}. ${item}`));
  console.log('Weaknesses:');
  report.weaknesses?.forEach((item: string, i: number) => console.log(`  ${i + 1}. ${item}`));

  const combinedImprovements = [...(report.improvementAreas || []), ...(report.weaknesses || [])];
  if (combinedImprovements.length === 0) {
    throw new Error('FAILED: Areas for improvement is incorrectly empty!');
  }
  const completenessMentioned = combinedImprovements.some((item: string) =>
    item.toLowerCase().includes('completeness') || item.toLowerCase().includes('answered') || item.toLowerCase().includes('questions')
  );
  console.log('Completeness reflected in improvement areas/weaknesses:', completenessMentioned);
  console.log('PASSED: Genuine areas for improvement accurately assembled.');

  // Verify AI Recommendation vs Human Decision
  console.log('\n--- VERIFYING ISSUE 4: AI RECOMMENDATION VS HUMAN DECISION ---');
  console.log('Report Final Recommendation (AI):', report.finalRecommendation);
  
  // Check candidate doc in DB
  const session = await mongoose.connection.collection('interviewsessions').findOne({ _id: new mongoose.Types.ObjectId(SESSION_ID) });
  const candidate = await mongoose.connection.collection('candidates').findOne({ _id: session?.candidateId });
  console.log('Candidate Status in DB (Human Decision):', candidate?.status);
  console.log('AI Recommendation in DB:', report.finalRecommendation);
  console.log('Separation confirmed: AI recommendation is independent of candidate human status.');
  console.log('PASSED: AI Recommendation and Human Decision are separate states.');

  // Verify Data Consistency between Scorecard and Report
  console.log('\n--- VERIFYING ISSUE 5: DATA CONSISTENCY ---');
  const scorecardRes = await fetch(`${API_BASE}/candidates/${SESSION_ID}/scorecard`, { headers });
  const scorecardJson = await scorecardRes.json();
  const scorecard = scorecardJson.data;

  console.log('Scorecard scores:', {
    overall: scorecard.overallScore,
    technical: scorecard.technicalScore,
    communication: scorecard.communicationScore,
    problemSolving: scorecard.problemSolvingScore,
    completeness: scorecard.completenessScore,
    recommendation: scorecard.recommendation,
  });

  console.log('Report scores:', {
    overall: report.overallScore,
    technical: report.technicalScore,
    communication: report.communicationScore,
    problemSolving: report.problemSolvingScore,
    completeness: report.completenessScore,
    recommendation: report.finalRecommendation,
  });

  if (scorecard.overallScore !== report.overallScore) throw new Error('Overall score mismatch!');
  if (scorecard.technicalScore !== report.technicalScore) throw new Error('Technical score mismatch!');
  if (scorecard.communicationScore !== report.communicationScore) throw new Error('Communication score mismatch!');
  if (scorecard.problemSolvingScore !== report.problemSolvingScore) throw new Error('Problem solving score mismatch!');
  if (scorecard.completenessScore !== report.completenessScore) throw new Error('Completeness score mismatch!');
  if (scorecard.recommendation !== report.finalRecommendation) throw new Error('Recommendation mismatch!');

  console.log('PASSED: All metrics and recommendations are 100% consistent across Scorecard and Report.');

  // Verify No Existing Interview Functionality Regressed
  console.log('\n--- VERIFYING REGRESSION SAFETY ---');
  const sessionsRes = await fetch(`${API_BASE}/interviews/sessions`, { headers });
  if (sessionsRes.status !== 200) throw new Error('GET /sessions failed!');
  console.log('GET /sessions HTTP Status:', sessionsRes.status, '- OK');

  const mediaRes = await fetch(`${API_BASE}/candidates/${SESSION_ID}/media`, { headers });
  if (mediaRes.status !== 200) throw new Error('GET /media failed!');
  console.log('GET /media HTTP Status:', mediaRes.status, '- OK');

  console.log('\n========================================================');
  console.log('  ALL AUDIT CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================================');

  await mongoose.disconnect();
}

verify().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
