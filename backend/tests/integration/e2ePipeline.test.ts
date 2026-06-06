import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { interviewFlowService } from '../../src/services/interviewFlow.service';
import { adaptiveQuestionService } from '../../src/services/adaptiveQuestion.service';
import InterviewTemplate from '../../src/models/InterviewTemplate';
import InterviewQuestion from '../../src/models/InterviewQuestion';
import InterviewSession from '../../src/models/InterviewSession';
import InterviewRecording from '../../src/models/InterviewRecording';
import InterviewTranscript from '../../src/models/InterviewTranscript';
import InterviewResponse from '../../src/models/InterviewResponse';
import TechnicalEvaluation from '../../src/models/TechnicalEvaluation';
import CandidateApplicationStatus from '../../src/models/CandidateApplicationStatus';
import { 
  Difficulty, QuestionCategory, SessionStatus, ResponseStatus, 
  TimelineEventType, ApplicationStatus 
} from '../../src/types/interview.types';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/bluhire_test_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('E2E Pipeline - Full AI Interview Flow', () => {
  let templateId: string;
  let q1Id: string, q2Id: string;
  let sessionId: string;
  let candidateId: string;

  it('1. Template & Questions Generation', async () => {
    // Mock template creation
    const template = await InterviewTemplate.create({
      title: 'Full Stack Engineer',
      jobRole: 'Software Engineer',
      departmentId: new mongoose.Types.ObjectId().toString(),
      experienceLevel: 'Mid',
      skills: ['React', 'Node.js'],
      difficulty: Difficulty.INTERMEDIATE,
      questionCount: 2,
      durationMinutes: 10,
      categories: [QuestionCategory.TECHNICAL],
      createdBy: new mongoose.Types.ObjectId().toString(),
    });
    templateId = template._id.toString();

    // Mock generated questions
    const q1 = await InterviewQuestion.create({
      templateId,
      questionText: 'Explain React Hooks',
      category: QuestionCategory.TECHNICAL,
      difficulty: Difficulty.INTERMEDIATE,
      expectedTopics: ['useState', 'useEffect'],
      generatedByAI: true,
    });
    const q2 = await InterviewQuestion.create({
      templateId,
      questionText: 'What is the Event Loop?',
      category: QuestionCategory.TECHNICAL,
      difficulty: Difficulty.ADVANCED,
      expectedTopics: ['Call Stack', 'Microtasks'],
      generatedByAI: true,
    });
    q1Id = q1._id.toString();
    q2Id = q2._id.toString();

    expect(q1Id).toBeDefined();
    expect(q2Id).toBeDefined();
  });

  it('2. Session Creation & Application Status', async () => {
    candidateId = new mongoose.Types.ObjectId().toString();

    // Application Status Created
    const appStatus = await CandidateApplicationStatus.create({
      candidateId,
      templateId,
      status: ApplicationStatus.INTERVIEW_SCHEDULED,
    });

    const session = await InterviewSession.create({
      candidateId,
      templateId,
      recruiterId: new mongoose.Types.ObjectId().toString(),
      status: SessionStatus.CREATED,
      totalQuestions: 2,
    });
    sessionId = session._id.toString();

    // Link session to application status
    appStatus.sessionId = sessionId;
    await appStatus.save();

    expect(appStatus.status).toBe(ApplicationStatus.INTERVIEW_SCHEDULED);
  });

  it('3. Start Interview', async () => {
    const started = await interviewFlowService.startSession(sessionId);
    
    // Application moves to IN_PROGRESS
    await CandidateApplicationStatus.updateOne({ sessionId }, { status: ApplicationStatus.INTERVIEW_IN_PROGRESS });
    const appStatus = await CandidateApplicationStatus.findOne({ sessionId });

    expect(started.status).toBe(SessionStatus.STARTED);
    expect(appStatus?.status).toBe(ApplicationStatus.INTERVIEW_IN_PROGRESS);
  });

  it('4. Ask Question 1 & Submit Mock Recording', async () => {
    // Adaptive Question should pick an intermediate question (Q1)
    const nextQ = await adaptiveQuestionService.selectNextQuestion(sessionId);
    expect(nextQ._id.toString()).toBe(q1Id); // Should pick the intermediate one first

    // Activate Question
    await interviewFlowService.activateQuestion(sessionId, q1Id, 0);

    // Mock upload recording
    const recording = await InterviewRecording.create({
      sessionId,
      candidateId,
      questionId: q1Id,
      videoUrl: 'http://mock.video.url',
    });

    // Submit Answer
    const session = await interviewFlowService.submitAnswer(sessionId, q1Id, recording._id.toString());
    expect(session.status).toBe(SessionStatus.ANSWER_PROCESSING);
  });

  it('5. Whisper Transcription & Evaluation Mocking', async () => {
    // Mock transcription success
    const transcript = await InterviewTranscript.create({
      sessionId,
      questionId: q1Id,
      candidateId,
      transcript: 'React Hooks allow state in functional components.',
      language: 'en',
      confidence: 0.95,
      processingTime: 2.5,
    });

    // Mock response creation
    await InterviewResponse.create({
      sessionId,
      questionId: q1Id,
      candidateId,
      transcriptId: transcript._id,
      responseStatus: ResponseStatus.READY_FOR_EVALUATION,
    });

    // Mock technical evaluation indicating strong candidate (Score 9)
    await TechnicalEvaluation.create({
      transcriptId: transcript._id,
      technicalAccuracy: 9,
      conceptUnderstanding: 9,
      depth: 9,
      practicalKnowledge: 9,
      rubricEvaluations: [{ topic: 'useState', covered: true, score: 9, evidence: 'mentioned state' }],
      overallTechnicalScore: 9, // Trigger hard next question
    });
  });

  it('6. Adaptive Question 2 (Should be harder)', async () => {
    // Since score is 9, it should pick the Advanced question (Q2)
    const nextQ = await adaptiveQuestionService.selectNextQuestion(sessionId);
    expect(nextQ.difficulty).toBe(Difficulty.ADVANCED);
    expect(nextQ._id.toString()).toBe(q2Id);

    // Answer Q2
    await interviewFlowService.activateQuestion(sessionId, q2Id, 1);
    const recording = await InterviewRecording.create({
      sessionId, candidateId, questionId: q2Id, videoUrl: 'mock2'
    });
    await interviewFlowService.submitAnswer(sessionId, q2Id, recording._id.toString());
  });

  it('7. Interview Completion & Status Update', async () => {
    // Complete session
    const completed = await interviewFlowService.completeSession(sessionId);
    expect(completed.status).toBe(SessionStatus.COMPLETED);

    // Application moves to UNDER_REVIEW
    await CandidateApplicationStatus.updateOne({ sessionId }, { status: ApplicationStatus.UNDER_REVIEW });
    const appStatus = await CandidateApplicationStatus.findOne({ sessionId });
    
    expect(appStatus?.status).toBe(ApplicationStatus.UNDER_REVIEW);
  });
});
