import mongoose, { Schema, Document } from 'mongoose';
import { SessionStatus } from '../types/interview.types';

export interface IInterviewSession extends Document {
  _id: any;
  candidateId: string; // Reference to Candidate _id
  templateId: string; // Reference to InterviewTemplate _id
  recruiterId: string; // Reference to User _id
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // In minutes or seconds
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
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      required: [true, 'Template ID is required'],
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewSessionSchema.index({ status: 1 });
InterviewSessionSchema.index({ candidateId: 1, status: 1 });
InterviewSessionSchema.index({ createdAt: -1 });

export default mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
