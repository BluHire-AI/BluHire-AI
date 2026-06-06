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

    // 1. Fetch all previous responses for this session
    const previousResponses = await InterviewResponse.find({ sessionId });
    const askedQuestionIds = previousResponses.map(r => r.questionId);

    // 2. Determine target difficulty based on previous scores
    let targetDifficulty = Difficulty.INTERMEDIATE; // Default
    let averageScore = 0;

    if (previousResponses.length > 0) {
      // Get all evaluations for the transcripts attached to these responses
      const transcriptIds = previousResponses.filter(r => r.transcriptId).map(r => r.transcriptId as string);
      
      const evaluations = await TechnicalEvaluation.find({ transcriptId: { $in: transcriptIds } });
      
      if (evaluations.length > 0) {
        const totalScore = evaluations.reduce((sum, ev) => sum + ev.overallTechnicalScore, 0);
        averageScore = totalScore / evaluations.length;

        // Rule: Strong candidate → Harder questions, Weak candidate → Easier questions
        if (averageScore >= 8) {
          targetDifficulty = Difficulty.ADVANCED;
        } else if (averageScore <= 4) {
          targetDifficulty = Difficulty.BEGINNER;
        } else {
          targetDifficulty = Difficulty.INTERMEDIATE;
        }
      }
    }

    // 3. Determine target category (Balanced distribution)
    // Find all questions for this template
    const allTemplateQuestions = await InterviewQuestion.find({ templateId: session.templateId });
    const unaskedQuestions = allTemplateQuestions.filter(q => !askedQuestionIds.includes(q._id.toString()));

    if (unaskedQuestions.length === 0) {
      return null; // No more questions available
    }

    // Count categories of asked questions to find the least asked category
    const categoryCounts: Record<string, number> = {};
    Object.values(QuestionCategory).forEach(cat => categoryCounts[cat] = 0);
    
    // We need to fetch the actual question documents for the asked ones to know their categories
    const askedQuestionsDetails = await InterviewQuestion.find({ _id: { $in: askedQuestionIds } });
    askedQuestionsDetails.forEach(q => {
      if (q.category) categoryCounts[q.category]++;
    });

    // Sort categories by least asked
    const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[a] - categoryCounts[b]);

    // 4. Select the best match question
    // Try to match both category and difficulty
    for (const targetCategory of sortedCategories) {
      const perfectMatch = unaskedQuestions.find(q => q.category === targetCategory && q.difficulty === targetDifficulty);
      if (perfectMatch) return perfectMatch;
    }

    // Fallback 1: Just match difficulty
    const difficultyMatch = unaskedQuestions.find(q => q.difficulty === targetDifficulty);
    if (difficultyMatch) return difficultyMatch;

    // Fallback 2: Just match category
    const categoryMatch = unaskedQuestions.find(q => q.category === sortedCategories[0]);
    if (categoryMatch) return categoryMatch;

    // Final Fallback: Return any unasked question
    return unaskedQuestions[0];
  }
}

export const adaptiveQuestionService = new AdaptiveQuestionService();
