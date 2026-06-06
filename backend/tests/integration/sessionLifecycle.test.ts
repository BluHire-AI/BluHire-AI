import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { interviewFlowService } from '../../src/services/interviewFlow.service';
import InterviewSession from '../../src/models/InterviewSession';
import InterviewTimeline from '../../src/models/InterviewTimeline';
import { SessionStatus, TimelineEventType } from '../../src/types/interview.types';

// Mock DB connection
beforeAll(async () => {
  // Use a local test DB
  await mongoose.connect('mongodb://localhost:27017/bluhire_test_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await InterviewSession.deleteMany({});
  await InterviewTimeline.deleteMany({});
});

describe('InterviewFlowService - Session Lifecycle', () => {
  it('should start a session from CREATED state and log Timeline event', async () => {
    // 1. Create a dummy session
    const session = await InterviewSession.create({
      candidateId: new mongoose.Types.ObjectId().toString(),
      templateId: new mongoose.Types.ObjectId().toString(),
      recruiterId: new mongoose.Types.ObjectId().toString(),
      status: SessionStatus.CREATED,
      totalQuestions: 5,
    });

    // 2. Start the session
    const startedSession = await interviewFlowService.startSession(session._id.toString());
    
    // 3. Verify state
    expect(startedSession.status).toBe(SessionStatus.STARTED);
    expect(startedSession.startedAt).toBeDefined();

    // 4. Verify Timeline
    const timelineEvents = await InterviewTimeline.find({ sessionId: session._id });
    expect(timelineEvents.length).toBe(1);
    expect(timelineEvents[0].eventType).toBe(TimelineEventType.SESSION_STARTED);
  });

  it('should fail to complete a session early if questions remain', async () => {
    const session = await InterviewSession.create({
      candidateId: new mongoose.Types.ObjectId().toString(),
      templateId: new mongoose.Types.ObjectId().toString(),
      recruiterId: new mongoose.Types.ObjectId().toString(),
      status: SessionStatus.ANSWER_PROCESSING,
      currentQuestionIndex: 2,
      totalQuestions: 5, // Requires 5 questions
    });

    await expect(interviewFlowService.completeSession(session._id.toString()))
      .rejects
      .toThrow('Cannot complete interview early. There are still unanswered questions.');
  });

  it('should successfully complete session when all questions answered', async () => {
    const session = await InterviewSession.create({
      candidateId: new mongoose.Types.ObjectId().toString(),
      templateId: new mongoose.Types.ObjectId().toString(),
      recruiterId: new mongoose.Types.ObjectId().toString(),
      status: SessionStatus.ANSWER_PROCESSING,
      currentQuestionIndex: 4, // 0-indexed, so 4 is the 5th question
      totalQuestions: 5,
      startedAt: new Date(Date.now() - 60000), // Started 1 min ago
    });

    const completedSession = await interviewFlowService.completeSession(session._id.toString());
    
    expect(completedSession.status).toBe(SessionStatus.COMPLETED);
    expect(completedSession.completedAt).toBeDefined();
    expect(completedSession.duration).toBeGreaterThanOrEqual(59);

    const timelineEvents = await InterviewTimeline.find({ sessionId: session._id });
    expect(timelineEvents.length).toBe(1);
    expect(timelineEvents[0].eventType).toBe(TimelineEventType.SESSION_COMPLETED);
  });
});
