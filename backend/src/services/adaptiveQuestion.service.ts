import InterviewSession, { IInterviewSession, ICompetencyCoverage } from '../models/InterviewSession';
import InterviewQuestion, { IInterviewQuestion } from '../models/InterviewQuestion';
import InterviewResponse from '../models/InterviewResponse';
import InterviewTranscript from '../models/InterviewTranscript';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import { questionGeneratorService } from './question-generator.service';

export class AdaptiveQuestionService {
  private activeGenerations = new Map<string, Promise<IInterviewQuestion | null>>();

  /**
   * Intelligently selects or generates the next question adaptively.
   * Backend remains the sole authority on interview termination and state.
   */
  async selectNextQuestion(sessionId: string): Promise<IInterviewQuestion | null> {
    if (this.activeGenerations.has(sessionId)) {
      console.log(`[Next Question] Generation already in-flight for sessionId=${sessionId}. Awaiting authoritative promise.`);
      return await this.activeGenerations.get(sessionId)!;
    }

    const generationPromise = this._executeSelectNextQuestion(sessionId);
    this.activeGenerations.set(sessionId, generationPromise);

    try {
      return await generationPromise;
    } finally {
      this.activeGenerations.delete(sessionId);
    }
  }

  private async _executeSelectNextQuestion(sessionId: string): Promise<IInterviewQuestion | null> {
    console.log(`[Interview Init] sessionId=${sessionId}`);
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error(`Interview session not found: ${sessionId}`);

    // Check if session has expired
    if (session.tokenExpiresAt && new Date() > session.tokenExpiresAt) {
      throw new Error('Interview link has expired.');
    }

    // -------------------------------------------------------------
    // LEGACY SESSIONS (created with templateId and no Job context)
    // -------------------------------------------------------------
    if (!session.jobId && session.templateId) {
      console.log(`[AdaptiveEngine] [Session ${sessionId}] Running in Legacy Template mode for templateId ${session.templateId}`);
      const allTemplateQuestions = await InterviewQuestion.find({ templateId: session.templateId }).sort({ createdAt: 1 });
      const currentIndex = session.currentQuestionIndex || 0;
      if (currentIndex >= allTemplateQuestions.length) {
        return null;
      }
      return allTemplateQuestions[currentIndex];
    }

    // -------------------------------------------------------------
    // MODERN JOB-AWARE SESSIONS (Job document is the source of truth)
    // -------------------------------------------------------------
    const job = await questionGeneratorService.resolveJobForSession(session);
    console.log(`[Job Resolve] jobId=${job._id} title="${job.title}"`);

    // Ensure Competency Plan exists
    const competencies = await questionGeneratorService.initializeSessionCompetencies(session, job);
    console.log(`[Competency Plan] loaded count=${competencies.length}`);

    // Fetch existing questions and candidate responses for this session
    const existingQuestions = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
    const responses = await InterviewResponse.find({ sessionId: session._id });
    const respondedQuestionIds = new Set(responses.map(r => r.questionId?.toString()));

    console.log(`[Next Question] requested sessionId=${sessionId} jobId=${job._id} existingQuestions=${existingQuestions.length} responses=${responses.length}`);

    // If an existing question has NOT been responded to (answered or skipped), deliver it immediately
    const unrespondedQuestion = existingQuestions.find(q => !respondedQuestionIds.has(q._id.toString()));
    if (unrespondedQuestion) {
      console.log(`[Next Question] returned sessionId=${sessionId} jobId=${job._id} questionId=${unrespondedQuestion._id} (active question delivery)`);
      return unrespondedQuestion;
    }

    // -------------------------------------------------------------
    // AUTHORITATIVE BACKEND TERMINATION RULES
    // -------------------------------------------------------------
    const minQuestions = session.interviewConfig?.minimumQuestions || 4;
    const maxQuestions = session.interviewConfig?.maximumQuestions || 7;
    const targetQuestions = session.interviewConfig?.targetQuestions || 5;
    const questionsAsked = responses.length;

    console.log(`[AdaptiveEngine] [Session ${sessionId}] Responses recorded: ${questionsAsked}, Bounds: [min: ${minQuestions}, target: ${targetQuestions}, max: ${maxQuestions}]`);

    // Hard Rule 1: Max questions reached -> Authoritative finish (absolute precedence)
    if (questionsAsked >= maxQuestions) {
      console.log(`[AdaptiveEngine] [Session ${sessionId}] Hard termination: Maximum questions limit (${maxQuestions}) reached. Completing interview.`);
      return null;
    }

    // Hard Rule 2: Minimum questions protection (never terminate before minimumQuestions is satisfied)
    if (questionsAsked < minQuestions) {
      console.log(`[AdaptiveEngine] [Session ${sessionId}] Minimum questions bound (${minQuestions}) not yet met (asked: ${questionsAsked}). Continuing interview.`);
    } else {
      // Rule 3: Check high-importance competencies coverage at or above targetQuestions
      const highImportance = (session.competencyPlan || []).filter(c => c.importance === 'high');
      const allHighCovered = highImportance.length > 0 && highImportance.every(c => c.covered && c.coverageScore >= 0.6);

      if (questionsAsked >= targetQuestions && allHighCovered) {
        console.log(`[AdaptiveEngine] [Session ${sessionId}] Target reached (${questionsAsked} questions) with all high-importance competencies satisfied. Completing interview.`);
        return null;
      }
    }

    // -------------------------------------------------------------
    // SELECT NEXT TARGET COMPETENCY
    // -------------------------------------------------------------
    let targetCompetency: ICompetencyCoverage | undefined;

    // 1. Uncovered high-importance
    targetCompetency = (session.competencyPlan || []).find(c => c.importance === 'high' && (!c.covered || c.questionsAsked === 0));

    // 2. Uncovered medium-importance
    if (!targetCompetency) {
      targetCompetency = (session.competencyPlan || []).find(c => c.importance === 'medium' && (!c.covered || c.questionsAsked === 0));
    }

    // 3. Partially covered with lowest coverageScore
    if (!targetCompetency) {
      const sortedByCoverage = [...(session.competencyPlan || [])].sort((a, b) => (a.coverageScore || 0) - (b.coverageScore || 0));
      targetCompetency = sortedByCoverage[0];
    }

    // Fallback to first competency if none selected
    if (!targetCompetency && session.competencyPlan && session.competencyPlan.length > 0) {
      targetCompetency = session.competencyPlan[0];
    }

    if (!targetCompetency) {
      throw new Error(`[AdaptiveEngine] No competencies found in plan for session ${sessionId}`);
    }

    console.log(`[AdaptiveEngine] [Session ${sessionId}] Next target competency selected: "${targetCompetency.name}" (importance: ${targetCompetency.importance}, asked: ${targetCompetency.questionsAsked})`);

    // -------------------------------------------------------------
    // GATHER CANDIDATE'S PREVIOUS ANSWERS FOR CONTEXT
    // -------------------------------------------------------------
    const transcripts = await InterviewTranscript.find({ sessionId: session._id });
    const evaluations = await TechnicalEvaluation.find({ transcriptId: { $in: transcripts.map(t => t._id) } });

    const previousAnswersContext = existingQuestions.map((q) => {
      const tr = transcripts.find(t => t.questionId?.toString() === q._id.toString());
      const ev = tr ? evaluations.find(e => e.transcriptId.toString() === tr._id.toString()) : null;
      return {
        questionText: q.questionText,
        competency: q.competency,
        transcript: tr?.transcript || '',
        score: ev ? ev.overallTechnicalScore : undefined,
      };
    });

    // -------------------------------------------------------------
    // GENERATE AND PERSIST NEXT ADAPTIVE QUESTION
    // -------------------------------------------------------------
    console.log(`[AI Generation] started sessionId=${sessionId} jobId=${job._id} competency="${targetCompetency.name}"`);
    const nextQuestion = await questionGeneratorService.generateAndSaveNextQuestion(
      session,
      job,
      targetCompetency,
      existingQuestions,
      previousAnswersContext
    );

    // Update session tracking
    const compIdx = (session.competencyPlan || []).findIndex(c => c.name === targetCompetency!.name);
    if (compIdx !== -1 && session.competencyPlan) {
      session.competencyPlan[compIdx].questionsAsked = (session.competencyPlan[compIdx].questionsAsked || 0) + 1;
    }
    const targetTotal = session.interviewConfig?.targetQuestions || session.totalQuestions || 5;
    const currentMax = session.interviewConfig?.maximumQuestions || 7;
    session.totalQuestions = Math.min(currentMax, Math.max(targetTotal, existingQuestions.length + 1));
    await session.save();

    console.log(`[Next Question] returned sessionId=${sessionId} jobId=${job._id} questionId=${nextQuestion._id}`);
    return nextQuestion;
  }

  /**
   * Evaluates current interview progress and returns authoritative backend termination decision.
   */
  async evaluateInterviewProgress(sessionId: string): Promise<{
    isTerminated: boolean;
    reason: string;
    totalQuestionsAsked: number;
    highImportanceCompetenciesCovered: boolean;
  }> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error(`Interview session not found: ${sessionId}`);

    const existingQuestions = await InterviewQuestion.find({ sessionId: session._id });
    const questionsAsked = existingQuestions.length;
    const minQuestions = session.interviewConfig?.minimumQuestions || 4;
    const maxQuestions = session.interviewConfig?.maximumQuestions || 8;
    const targetQuestions = session.interviewConfig?.targetQuestions || 5;

    const highImportance = (session.competencyPlan || []).filter(c => c.importance === 'high');
    const allHighCovered = highImportance.length > 0 && highImportance.every(c => c.covered && (c.coverageScore || 0) >= 60);

    if (questionsAsked >= maxQuestions) {
      return {
        isTerminated: true,
        reason: `Maximum questions limit (${maxQuestions}) reached.`,
        totalQuestionsAsked: questionsAsked,
        highImportanceCompetenciesCovered: allHighCovered,
      };
    }

    if (questionsAsked >= minQuestions && questionsAsked >= targetQuestions && allHighCovered) {
      return {
        isTerminated: true,
        reason: `Target questions (${targetQuestions}) reached with all high-importance competencies covered.`,
        totalQuestionsAsked: questionsAsked,
        highImportanceCompetenciesCovered: allHighCovered,
      };
    }

    return {
      isTerminated: false,
      reason: `Interview in progress. ${questionsAsked} asked (min: ${minQuestions}, target: ${targetQuestions}, max: ${maxQuestions}).`,
      totalQuestionsAsked: questionsAsked,
      highImportanceCompetenciesCovered: allHighCovered,
    };
  }
}

export const adaptiveQuestionService = new AdaptiveQuestionService();
