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
import InterviewTemplate from '../models/InterviewTemplate';
import { User } from '../models/User';
import Application, { ApplicationStage } from '../models/Application';
import { getQuestionReviewsBySession } from '../services/question-review.service';
import { SessionStatus, QuestionCategory, Difficulty, ResponseStatus } from '../types/interview.types';
import { SystemRoles } from '../models/roles';

async function runEndToEndVerification() {
  console.log('=== STARTING END-TO-END VERIFICATION SCRIPT ===');
  
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bluhire';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  try {
    // 1. Find or create recruiter & template
    let recruiter = await User.findOne({ role: SystemRoles.HR_RECRUITER });
    if (!recruiter) {
      recruiter = await User.create({
        firstName: 'Test',
        lastName: 'Recruiter',
        email: `recruiter_${Date.now()}@test.com`,
        role: SystemRoles.HR_RECRUITER
      });
    }

    let template = await InterviewTemplate.findOne();
    if (!template) {
      template = await InterviewTemplate.create({
        title: 'Full Stack Engineer Assessment',
        createdBy: (recruiter as any)._id.toString(),
        durationMinutes: 30,
      });
    }

    // Ensure template has 5 questions
    let questions = await InterviewQuestion.find({ templateId: (template as any)._id }).sort({ createdAt: 1 });
    if (questions.length < 5) {
      await InterviewQuestion.deleteMany({ templateId: (template as any)._id });
      questions = [];
      const qTexts = [
        'Explain React state management and hooks.',
        'How do you design scalable REST APIs?',
        'Describe a complex debugging challenge you solved.',
        'Explain database indexing and query optimization.',
        'How do you handle team conflict and tight deadlines?'
      ];
      for (const qt of qTexts) {
        const q = await InterviewQuestion.create({
          templateId: (template as any)._id,
          questionText: qt,
          category: QuestionCategory.TECHNICAL,
          difficulty: Difficulty.INTERMEDIATE,
        });
        questions.push(q);
      }
    }

    // 2. Create Fresh Candidate & Interview Session
    const timestamp = Date.now();
    const candidate = await Candidate.create({
      firstName: 'VerificationTest',
      lastName: `Candidate-${timestamp}`,
      email: `testcandidate_${timestamp}@bluhire.ai`,
      phone: '+15550199',
      candidateCode: `CAN-${timestamp}`,
      status: 'UNDER_REVIEW',
    });

    const publicToken = `fresh_token_${timestamp}`;
    const session = await InterviewSession.create({
      candidateId: (candidate as any)._id.toString(),
      templateId: (template as any)._id.toString(),
      recruiterId: (recruiter as any)._id.toString(),
      status: SessionStatus.STARTED,
      totalQuestions: 5,
      currentQuestionIndex: 0,
      publicToken,
    });

    await Application.create({
      candidateId: (candidate as any)._id.toString(),
      jobId: new mongoose.Types.ObjectId().toString(),
      currentStage: ApplicationStage.INTERVIEW,
    });

    console.log('\n--- FRESH TEST SESSION CREATED ---');
    console.log('Session ID:', (session as any)._id.toString());
    console.log('Candidate ID:', (candidate as any)._id.toString());
    console.log('Public Token:', publicToken);

    // 3. Simulate Candidate Actions
    // Q1: Answered verbally with UNIQUE-73921
    const q1 = questions[0];
    const rec1 = await InterviewRecording.create({
      sessionId: (session as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      questionId: (q1 as any)._id.toString(),
      questionIndex: 0,
      videoUrl: `/uploads/interviews/${publicToken}_q0_${timestamp}.webm`,
    });

    const tr1 = await InterviewTranscript.create({
      sessionId: (session as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      questionId: (q1 as any)._id.toString(),
      questionIndex: 0,
      transcript: 'I am answering question one. UNIQUE-73921.',
    });

    await InterviewResponse.create({
      sessionId: (session as any)._id.toString(),
      questionId: (q1 as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      recordingId: (rec1 as any)._id.toString(),
      transcriptId: (tr1 as any)._id.toString(),
      responseStatus: ResponseStatus.TRANSCRIBED,
    });

    // Q2: Answered verbally with UNIQUE-48216
    const q2 = questions[1];
    const rec2 = await InterviewRecording.create({
      sessionId: (session as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      questionId: (q2 as any)._id.toString(),
      questionIndex: 1,
      videoUrl: `/uploads/interviews/${publicToken}_q1_${timestamp}.webm`,
    });

    const tr2 = await InterviewTranscript.create({
      sessionId: (session as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      questionId: (q2 as any)._id.toString(),
      questionIndex: 1,
      transcript: 'I am answering question two. UNIQUE-48216.',
    });

    await InterviewResponse.create({
      sessionId: (session as any)._id.toString(),
      questionId: (q2 as any)._id.toString(),
      candidateId: (candidate as any)._id.toString(),
      recordingId: (rec2 as any)._id.toString(),
      transcriptId: (tr2 as any)._id.toString(),
      responseStatus: ResponseStatus.TRANSCRIBED,
    });

    // Q3 - Q5: SKIPPED explicitly (No recording, no transcript created)
    for (let i = 2; i < 5; i++) {
      const q = questions[i];
      await InterviewResponse.create({
        sessionId: (session as any)._id.toString(),
        questionId: (q as any)._id.toString(),
        candidateId: (candidate as any)._id.toString(),
        responseStatus: ResponseStatus.PENDING,
      });
    }

    (session as any).status = SessionStatus.COMPLETED;
    (session as any).completedAt = new Date();
    await session.save();

    console.log('\n--- MONGODB VERIFICATION ---');
    const dbResponses = await InterviewResponse.find({ sessionId: (session as any)._id });
    const dbRecordings = await InterviewRecording.find({ sessionId: (session as any)._id });
    const dbTranscripts = await InterviewTranscript.find({ sessionId: (session as any)._id });

    console.log(`InterviewResponse records count: ${dbResponses.length}`);
    console.log(`InterviewRecording records count: ${dbRecordings.length}`);
    console.log(`InterviewTranscript records count: ${dbTranscripts.length}`);

    console.log('\nTranscripts stored in DB:');
    dbTranscripts.forEach((t) => {
      console.log(`- QID: ${t.questionId}, QIdx: ${t.questionIndex}, Text: "${t.transcript}"`);
    });

    // 4. Verify API Response Output via question-review service
    const apiResult = await getQuestionReviewsBySession((session as any)._id.toString());

    console.log('\n--- ACTUAL API RESPONSE DATA ---');
    console.log('Total Questions:', apiResult?.totalQuestions);
    console.log('Answered Count:', apiResult?.answeredCount);
    console.log('Skipped Count:', apiResult?.skippedCount);
    console.log('Completeness Score:', apiResult?.completenessScore, '%');

    console.log('\nQuestion Breakdown:');
    apiResult?.questions.forEach((q) => {
      console.log(`Question ${q.questionNumber}: Status=${q.status}, TranscriptStatus=${q.transcript.status}, Text="${q.transcript.text}"`);
    });

    console.log('\n=== VERIFICATION COMPLETE ===');
  } catch (err) {
    console.error('Verification Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runEndToEndVerification();
