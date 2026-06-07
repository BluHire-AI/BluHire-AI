import { Difficulty, QuestionCategory, TemplateStatus, SessionStatus } from '../types/interview.types';

export interface CreateInterviewTemplateDTO {
  title: string;
  jobRole: string;
  departmentId: string;
  experienceLevel: string;
  skills: string[];
  difficulty: Difficulty;
  questionCount: number;
  durationMinutes: number;
  categories: QuestionCategory[];
}

export interface UpdateInterviewTemplateDTO {
  title?: string;
  jobRole?: string;
  departmentId?: string;
  experienceLevel?: string;
  skills?: string[];
  difficulty?: Difficulty;
  questionCount?: number;
  durationMinutes?: number;
  categories?: QuestionCategory[];
  status?: TemplateStatus;
}

export interface GenerateQuestionsDTO {
  templateId?: string; // Optional if generating without saving to a template first
  jobRole: string;
  skills: string[];
  experienceLevel: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface CreateInterviewSessionDTO {
  candidateId: string;
  templateId: string;
  recruiterId: string;
}

export interface UpdateSessionStatusDTO {
  status: SessionStatus;
  currentQuestionIndex?: number;
  duration?: number;
}
