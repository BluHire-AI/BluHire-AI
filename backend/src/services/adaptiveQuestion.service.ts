import InterviewQuestion from '../models/InterviewQuestion';
import InterviewResponse from '../models/InterviewResponse';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import InterviewSession from '../models/InterviewSession';
import { Difficulty, QuestionCategory } from '../types/interview.types';

export class AdaptiveQuestionService {
  /**
   * Intelligently selects the next question based on candidate's performance
   */
  async selectNextQuestion(sessionId: string): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    // Fetch all questions for this template sorted by creation order
    const allTemplateQuestions = await InterviewQuestion.find({ templateId: session.templateId }).sort({ createdAt: 1 });

    const currentIndex = session.currentQuestionIndex || 0;

    console.log(`[DEBUG_AUDIT] Linear NextQuestion: templateId=${session.templateId}, index=${currentIndex}, total=${allTemplateQuestions.length}`);

    if (currentIndex >= allTemplateQuestions.length) {
      return null; // No more questions
    }

    return allTemplateQuestions[currentIndex];
  }
}

export const adaptiveQuestionService = new AdaptiveQuestionService();
