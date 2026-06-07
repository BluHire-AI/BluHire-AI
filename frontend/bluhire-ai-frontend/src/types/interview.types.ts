export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionCategory {
  TECHNICAL = 'TECHNICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  PROBLEM_SOLVING = 'PROBLEM_SOLVING',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  COMMUNICATION = 'COMMUNICATION',
}

export enum SessionStatus {
  CREATED = 'CREATED',
  READY = 'READY',
  STARTED = 'STARTED',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  ANSWER_PROCESSING = 'ANSWER_PROCESSING',
  EVALUATING = 'EVALUATING',
  NEXT_QUESTION = 'NEXT_QUESTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuestionStatus {
  PENDING = 'PENDING',
  ASKED = 'ASKED',
  ANSWERED = 'ANSWERED',
  EVALUATED = 'EVALUATED',
  SKIPPED = 'SKIPPED',
}

export enum TimelineEventType {
  SESSION_STARTED = 'SESSION_STARTED',
  QUESTION_ASKED = 'QUESTION_ASKED',
  ANSWER_RECORDED = 'ANSWER_RECORDED',
  TRANSCRIPTION_COMPLETE = 'TRANSCRIPTION_COMPLETE',
  EVALUATION_COMPLETE = 'EVALUATION_COMPLETE',
  QUESTION_SKIPPED = 'QUESTION_SKIPPED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
}

export enum ResponseStatus {
  PENDING = 'PENDING',
  RECORDED = 'RECORDED',
  TRANSCRIBED = 'TRANSCRIBED',
  READY_FOR_EVALUATION = 'READY_FOR_EVALUATION',
  FAILED = 'FAILED',
}

export enum RecommendationDecision {
  HIRE = 'HIRE',
  MAYBE_HIRE = 'MAYBE_HIRE',
  REJECT = 'REJECT',
}

export enum ApplicationStatus {
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_IN_PROGRESS = 'INTERVIEW_IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  SELECTED = 'SELECTED',
}

export interface InterviewTemplate {
  _id: string;
  title: string;
  jobRole: string;
  departmentId: string;
  experienceLevel: string;
  skills: string[];
  difficulty: Difficulty;
  questionCount: number;
  durationMinutes: number;
  categories: QuestionCategory[];
  status: TemplateStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  _id: string;
  templateId: string;
  questionText: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  expectedTopics: string[];
  generatedByAI: boolean;
  createdAt: string;
}

export interface InterviewSession {
  _id: string;
  candidateId: string;
  templateId: string | InterviewTemplate;
  recruiterId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}
