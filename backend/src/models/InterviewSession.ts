import mongoose, { Schema, Document } from 'mongoose';
import { SessionStatus } from '../types/interview.types';

export interface ICompetencyCoverage {
  name: string;
  importance: 'high' | 'medium' | 'low';
  sourceSkills: string[];
  covered: boolean;
  coverageScore: number;
  questionsAsked: number;
}

export interface IInterviewConfig {
  targetQuestions: number;
  minimumQuestions: number;
  maximumQuestions: number;
}

export interface IInterviewSession extends Document {
  _id: any;
  candidateId: string; // Reference to Candidate _id
  jobId?: string; // Reference to Job _id (Authoritative context for modern interviews)
  applicationId?: string; // Reference to Application _id
  templateId?: string; // Reference to InterviewTemplate _id (Legacy fallback)
  recruiterId: string; // Reference to User _id
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  competencyPlan?: ICompetencyCoverage[];
  interviewConfig?: IInterviewConfig;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // In minutes or seconds
  publicToken?: string;
  tokenExpiresAt?: Date;
  proctoringRiskScore?: number;
  proctoringRiskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  proctoringSummary?: {
    gazeAwayCount?: number;
    faceMissingCount?: number;
    multipleFaceCount?: number;
    tabSwitchCount?: number;
    windowBlurCount?: number;
    fullscreenExitCount?: number;
    copyPasteCount?: number;
    cameraDisconnectCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSessionSchema = new Schema<any>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      index: true,
    },
    competencyPlan: [
      {
        name: { type: String, required: true },
        importance: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
        sourceSkills: { type: [String], default: [] },
        covered: { type: Boolean, default: false },
        coverageScore: { type: Number, default: 0 },
        questionsAsked: { type: Number, default: 0 },
      },
    ],
    interviewConfig: {
      targetQuestions: { type: Number, default: 5 },
      minimumQuestions: { type: Number, default: 4 },
      maximumQuestions: { type: Number, default: 8 },
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.CREATED,
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions count is required'],
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    publicToken: {
      type: String,
      unique: true,
      sparse: true, // Sparse allows nulls if we have legacy records
      index: true,
    },
    tokenExpiresAt: {
      type: Date,
    },
    proctoringRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    proctoringRiskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    proctoringSummary: {
      gazeAwayCount: { type: Number, default: 0 },
      faceMissingCount: { type: Number, default: 0 },
      multipleFaceCount: { type: Number, default: 0 },
      tabSwitchCount: { type: Number, default: 0 },
      windowBlurCount: { type: Number, default: 0 },
      fullscreenExitCount: { type: Number, default: 0 },
      copyPasteCount: { type: Number, default: 0 },
      cameraDisconnectCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewSessionSchema.index({ candidateId: 1, status: 1 });
InterviewSessionSchema.index({ createdAt: -1 });

export default mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
