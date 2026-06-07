import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeSnapshot {
  aiScore: number;
  aiRecommendation: string;
  matchingSkills: string[];
  missingSkills: string[];
  screeningSummary: string;
}

export interface IInterviewAssignment extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  interviewTemplateId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Started' | 'In Progress' | 'Completed' | 'Reviewed';
  assignedAt: Date;
  expiresAt: Date;
  magicToken?: string;
  magicTokenExpiresAt?: Date;
  isTokenUsed: boolean;
  maxAttempts: number;
  attemptCount: number;
  showResultsToCandidate?: boolean;
  lastAttemptAt?: Date;
  resumeSnapshot?: IResumeSnapshot;
  resumeScore?: number;
  resumeAnalysis?: string;
  screeningTimestamp?: Date;
  interviewScore?: number;
  finalCandidateScore?: number;
  rankingPosition?: number;
  rankingReasoning?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSnapshotSchema = new Schema<IResumeSnapshot>(
  {
    aiScore: { type: Number, default: 0 },
    aiRecommendation: { type: String, default: '' },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    screeningSummary: { type: String, default: '' },
  },
  { _id: false }
);

const InterviewAssignmentSchema = new Schema<IInterviewAssignment>(
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
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter ID is required'],
      index: true,
    },
    interviewTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      required: [true, 'Interview Template ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Started', 'In Progress', 'Completed', 'Reviewed'],
      default: 'Pending',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    magicToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    magicTokenExpiresAt: {
      type: Date,
    },
    isTokenUsed: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    showResultsToCandidate: {
      type: Boolean,
      default: false,
    },
    lastAttemptAt: {
      type: Date,
    },
    resumeSnapshot: {
      type: ResumeSnapshotSchema,
      default: null,
    },
    resumeScore: {
      type: Number,
      default: null,
    },
    resumeAnalysis: {
      type: String,
      default: null,
    },
    screeningTimestamp: {
      type: Date,
      default: null,
    },
    interviewScore: {
      type: Number,
      default: null,
    },
    finalCandidateScore: {
      type: Number,
      default: null,
      index: true,
    },
    rankingPosition: {
      type: Number,
      default: null,
    },
    rankingReasoning: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique assignment per candidate per job
InterviewAssignmentSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export default mongoose.model<IInterviewAssignment>('InterviewAssignment', InterviewAssignmentSchema);
