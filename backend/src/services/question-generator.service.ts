import axios from 'axios';
import Job, { IJob } from '../models/Job';
import InterviewSession, { IInterviewSession, ICompetencyCoverage } from '../models/InterviewSession';
import InterviewQuestion, { IInterviewQuestion } from '../models/InterviewQuestion';
import Application from '../models/Application';

export class QuestionGeneratorService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

  /**
   * Resolves the authoritative Job document for an interview session.
   * Throws INTERVIEW_JOB_CONTEXT_UNAVAILABLE if job cannot be resolved.
   */
  async resolveJobForSession(session: IInterviewSession): Promise<IJob> {
    let resolvedJobId = session.jobId;

    if (!resolvedJobId) {
      // Attempt lookup via candidate's Application
      const app = await Application.findOne({ candidateId: session.candidateId, status: { $ne: 'REJECTED' } }).sort({ createdAt: -1 });
      if (app && app.jobId) {
        resolvedJobId = app.jobId.toString();
        session.jobId = resolvedJobId;
        session.applicationId = app._id.toString();
        await session.save();
        console.log(`[JobResolution] [Session ${session._id}] Resolved jobId ${resolvedJobId} from Application ${app._id}`);
      }
    }

    if (!resolvedJobId) {
      const errMsg = `INTERVIEW_JOB_CONTEXT_UNAVAILABLE: No associated Job ID for interview session ${session._id}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }

    const job = await Job.findById(resolvedJobId);
    if (!job) {
      const errMsg = `INTERVIEW_JOB_CONTEXT_UNAVAILABLE: Job record ${resolvedJobId} not found for session ${session._id}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }

    return job;
  }

  /**
   * Generates and persists the Competency Plan for the session using the Job document.
   */
  async initializeSessionCompetencies(session: IInterviewSession, job: IJob): Promise<ICompetencyCoverage[]> {
    if (session.competencyPlan && session.competencyPlan.length > 0) {
      return session.competencyPlan;
    }

    console.log(`[CompetencyPlanning] [Job ${job._id}] [Session ${session._id}] Requesting competency plan for "${job.title}"...`);

    const jobPayload = {
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      responsibilities: job.responsibilities || '',
      experienceRequired: job.experienceRequired || 'Mid-level',
      employmentType: job.employmentType || 'Full-time',
    };

    try {
      const response = await axios.post(`${this.aiServiceUrl}/interview/plan-competencies`, {
        job: jobPayload,
      }, { timeout: 60000 });

      const data = response.data;
      if (!data || !Array.isArray(data.competencies) || data.competencies.length === 0) {
        throw new Error('AI returned empty competency plan.');
      }

      const plan: ICompetencyCoverage[] = data.competencies.map((c: any) => ({
        name: String(c.name || '').trim(),
        importance: ['high', 'medium', 'low'].includes(c.importance) ? c.importance : 'high',
        sourceSkills: Array.isArray(c.sourceSkills) ? c.sourceSkills : [],
        covered: false,
        coverageScore: 0,
        questionsAsked: 0,
      })).filter((c: ICompetencyCoverage) => c.name.length > 0);

      session.competencyPlan = plan;
      await session.save();

      console.log(`[CompetencyPlanning] [Session ${session._id}] Initialized ${plan.length} competencies: ${plan.map(p => p.name).join(', ')}`);
      return plan;
    } catch (err: any) {
      console.error(`[CompetencyPlanning] [Session ${session._id}] Failed to generate competency plan:`, err.message);
      throw new Error(`Failed to plan competencies: ${err.message}`);
    }
  }

  /**
   * Generates a single targeted question for targetCompetency, validates it, and saves it.
   */
  async generateAndSaveNextQuestion(
    session: IInterviewSession,
    job: IJob,
    targetCompetency: ICompetencyCoverage,
    previousQuestions: IInterviewQuestion[] = [],
    previousAnswers: any[] = []
  ): Promise<IInterviewQuestion> {
    const jobPayload = {
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      responsibilities: job.responsibilities || '',
      experienceRequired: job.experienceRequired || 'Mid-level',
    };

    const prevQTexts = previousQuestions.map(q => q.questionText);

    let attempts = 0;
    const maxAttempts = 3;
    let selectedQuestion: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[AI Generation] started sessionId=${session._id} jobId=${job._id} competency="${targetCompetency.name}" (attempt ${attempts}/${maxAttempts})`);

      const genRes = await axios.post(`${this.aiServiceUrl}/interview/generate-question`, {
        job: jobPayload,
        targetCompetency: {
          name: targetCompetency.name,
          importance: targetCompetency.importance,
          sourceSkills: targetCompetency.sourceSkills,
        },
        experienceLevel: job.experienceRequired || 'Mid-level',
        previousQuestions: prevQTexts,
        previousAnswers,
      }, { timeout: 30000 });

      const qData = genRes.data;
      if (!qData || !qData.question || typeof qData.question !== 'string') {
        console.warn(`[AI Generation] Attempt ${attempts} returned invalid format.`);
        continue;
      }

      // Layer 0 Validation: Spoken-interview character limit (max 500 chars)
      if (qData.question.length > 500) {
        console.warn(`[AI Generation] Attempt ${attempts} question exceeded 500 characters (${qData.question.length} chars). Retrying for conversational brevity...`);
        continue;
      }

      console.log(`[AI Generation] completed sessionId=${session._id} jobId=${job._id} question="${qData.question.substring(0, 60)}..." (${qData.question.length} chars)`);

      // Layer 1 Validation: Deduplication
      const isDuplicate = prevQTexts.some(
        pq => pq.toLowerCase().trim() === qData.question.toLowerCase().trim()
      );
      if (isDuplicate) {
        console.warn(`[Question Validation] Attempt ${attempts} duplicate detected. Retrying...`);
        continue;
      }

      // Layer 2 Validation: Semantic AI relevance check
      try {
        const valRes = await axios.post(`${this.aiServiceUrl}/interview/validate-question`, {
          job: jobPayload,
          question: qData,
        }, { timeout: 25000 });

        if (valRes.data && valRes.data.valid === false) {
          console.warn(`[Question Validation] Question rejected: ${valRes.data.reason}. Retrying...`);
          continue;
        }
      } catch (valErr: any) {
        // If validation endpoint times out, log non-fatal and proceed if Layer 1 passed
        console.warn('[Question Validation] Semantic validation check skipped or timed out:', valErr.message);
      }

      console.log(`[Question Validation] passed sessionId=${session._id} jobId=${job._id}`);
      selectedQuestion = qData;
      break;
    }

    if (!selectedQuestion) {
      throw new Error(`INTERVIEW_QUESTION_GENERATION_FAILED: Unable to generate a valid, unique question for competency "${targetCompetency.name}" after ${maxAttempts} attempts.`);
    }

    // Database-Level Safety Check (Hard boundary check immediately before persistence)
    const freshSession = await InterviewSession.findById(session._id);
    const currentDeliveredCount = await InterviewQuestion.countDocuments({ sessionId: session._id });
    const maxAllowed = freshSession?.interviewConfig?.maximumQuestions || 7;
    if (currentDeliveredCount >= maxAllowed) {
      console.warn(`[Database Safety] currentDeliveredCount (${currentDeliveredCount}) >= maximumQuestions (${maxAllowed}). Rejecting question persistence.`);
      throw new Error(`INTERVIEW_TERMINATED: Maximum question limit (${maxAllowed}) reached. Additional question generation aborted.`);
    }

    // Persist in MongoDB
    const createdQuestion = await InterviewQuestion.create({
      sessionId: session._id,
      jobId: job._id,
      questionText: selectedQuestion.question.trim(),
      category: selectedQuestion.category || 'TECHNICAL',
      competency: targetCompetency.name,
      difficulty: selectedQuestion.difficulty || 'INTERMEDIATE',
      reason: selectedQuestion.reason || `Evaluates ${targetCompetency.name} for ${job.title}`,
      sourceSkill: selectedQuestion.sourceSkill || targetCompetency.sourceSkills[0] || job.title,
      expectedTopics: Array.isArray(selectedQuestion.expectedTopics) ? selectedQuestion.expectedTopics : [],
      generatedByAI: true,
    });

    console.log(`[Question Persistence] questionId=${createdQuestion._id} sessionId=${session._id} jobId=${job._id}`);
    return createdQuestion;
  }
}

export const questionGeneratorService = new QuestionGeneratorService();
