import mongoose, { Schema, Document } from 'mongoose';

export enum ApplicationStage {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export interface IStageHistory {
  stage: ApplicationStage;
  changedAt: Date;
  changedBy: string; // User ID
  notes?: string;
}

export interface IApplication extends Document {
  _id: any;
  candidateId: string;
  jobId: string;
  employeeId?: string;
  currentStage: ApplicationStage;
  status: string; // ACTIVE, INACTIVE, REJECTED, HIRED
  appliedAt: Date;
  screenedAt?: Date;
  interviewedAt?: Date;
  offeredAt?: Date;
  hiredAt?: Date;
  aiScore?: number;
  screeningScore?: number;
  finalScore?: number;
  aiRecommendation?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  screeningSummary?: string;
  screeningStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  interviewStatus?: string;
  interviewScore?: number;
  interviewFeedback?: string;
  interviewCompletedAt?: Date;
  recruiterScore?: number;
  notes?: string;
  stageHistory: IStageHistory[];
  isDeleted: boolean;
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StageHistorySchema = new Schema<IStageHistory>(
  {
    stage: {
      type: String,
      enum: Object.values(ApplicationStage),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<any>(
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
      required: [true, 'Job ID is required'],
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    currentStage: {
      type: String,
      enum: Object.values(ApplicationStage),
      default: ApplicationStage.APPLIED,
      index: true,
    },
    status: {
      type: String,
      default: 'ACTIVE', // ACTIVE, INACTIVE, REJECTED, HIRED
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    screenedAt: {
      type: Date,
      default: null,
    },
    interviewedAt: {
      type: Date,
      default: null,
    },
    offeredAt: {
      type: Date,
      default: null,
    },
    hiredAt: {
      type: Date,
      default: null,
    },
    aiScore: {
      type: Number,
      default: null,
    },
    screeningScore: {
      type: Number,
      default: null,
    },
    finalScore: {
      type: Number,
      default: null,
    },
    aiRecommendation: {
      type: String,
      default: null,
    },
    matchingSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    screeningSummary: {
      type: String,
      default: null,
    },
    screeningStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    interviewStatus: {
      type: String,
      default: null,
    },
    interviewScore: {
      type: Number,
      default: null,
    },
    interviewFeedback: {
      type: String,
      default: null,
    },
    interviewCompletedAt: {
      type: Date,
      default: null,
    },
    recruiterScore: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    stageHistory: {
      type: [StageHistorySchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTestData: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique application per candidate per job to prevent duplicates
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ currentStage: 1, isDeleted: 1 });
ApplicationSchema.index({ status: 1, isDeleted: 1 });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
