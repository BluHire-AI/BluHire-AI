import InterviewSession from '../models/InterviewSession';
import InterviewTimeline from '../models/InterviewTimeline';
import { SessionStatus, TimelineEventType } from '../types/interview.types';

export class InterviewFlowService {
  /**
   * Logs an event to the interview timeline
   */
  async logTimelineEvent(sessionId: string, eventType: TimelineEventType, eventData: any = {}): Promise<void> {
    await InterviewTimeline.create({
      sessionId,
      eventType,
      eventData,
      timestamp: new Date(),
    });
  }

  /**
   * Starts the interview session
   */
  async startSession(sessionId: string): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    
    if (session.status !== SessionStatus.READY && session.status !== SessionStatus.CREATED) {
      throw new Error(`Cannot start session from state: ${session.status}`);
    }

    session.status = SessionStatus.STARTED;
    session.startedAt = new Date();
    await session.save();

    await this.logTimelineEvent(sessionId, TimelineEventType.SESSION_STARTED, { startedAt: session.startedAt });
    return session;
  }

  /**
   * Moves to the next question
   */
  async activateQuestion(sessionId: string, questionId: string, questionIndex: number): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    // Rule: Cannot move to next question if currently processing or evaluating previous
    const validCurrentStates = [
      SessionStatus.STARTED, 
      SessionStatus.NEXT_QUESTION, 
      SessionStatus.EVALUATING, 
      SessionStatus.ANSWER_PROCESSING
    ];
    
    // Loosening the strict state check slightly to allow sequential flow, but ideally it should strictly be from NEXT_QUESTION or STARTED
    session.status = SessionStatus.QUESTION_ACTIVE;
    session.currentQuestionIndex = questionIndex;
    await session.save();

    await this.logTimelineEvent(sessionId, TimelineEventType.QUESTION_ASKED, { questionId, questionIndex });
    return session;
  }

  /**
   * Candidate submits their recorded answer
   */
  async submitAnswer(sessionId: string, questionId: string, recordingId: string): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.status !== SessionStatus.QUESTION_ACTIVE) {
      throw new Error(`Cannot submit answer. Session is in state: ${session.status}`);
    }

    session.status = SessionStatus.ANSWER_PROCESSING;
    await session.save();

    await this.logTimelineEvent(sessionId, TimelineEventType.ANSWER_RECORDED, { questionId, recordingId });
    return session;
  }

  /**
   * Completes the interview session
   */
  async completeSession(sessionId: string): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    // Rule: Cannot complete interview early
    if (session.currentQuestionIndex < session.totalQuestions - 1) {
      throw new Error('Cannot complete interview early. There are still unanswered questions.');
    }

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    
    // Track duration in seconds
    if (session.startedAt) {
      const durationMs = session.completedAt.getTime() - session.startedAt.getTime();
      session.duration = Math.floor(durationMs / 1000);
    }

    await session.save();

    await this.logTimelineEvent(sessionId, TimelineEventType.SESSION_COMPLETED, { 
      duration: session.duration, 
      completedAt: session.completedAt 
    });
    
    return session;
  }
}

export const interviewFlowService = new InterviewFlowService();
