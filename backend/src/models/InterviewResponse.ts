import mongoose, { Schema, Document } from 'mongoose';
import { ResponseStatus, EvaluationStatus } from '../types/interview.types';

export interface IInterviewResponse extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  questionId: string; // Reference to InterviewQuestion _id
  candidateId: string; // Reference to Candidate _id
  recordingId?: string; // Reference to InterviewRecording _id
  transcriptId?: string; // Reference to InterviewTranscript _id
  responseStatus: ResponseStatus | string;
  evaluationStatus: EvaluationStatus | string;
  transcriptionError?: string | null;
  evaluationError?: string | null;
  answeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewResponseSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: [true, 'Question ID is required'],
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewRecording',
      default: null,
    },
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTranscript',
      default: null,
    },
    responseStatus: {
      type: String,
      default: ResponseStatus.PENDING,
      index: true,
    },
    evaluationStatus: {
      type: String,
      enum: Object.values(EvaluationStatus),
      default: EvaluationStatus.NOT_STARTED,
      index: true,
    },
    transcriptionError: {
      type: String,
      default: null,
    },
    evaluationError: {
      type: String,
      default: null,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewResponseSchema.index({ sessionId: 1, questionId: 1 }, { unique: true }); // One response per question per session
InterviewResponseSchema.index({ candidateId: 1, responseStatus: 1 });

export default mongoose.model<IInterviewResponse>('InterviewResponse', InterviewResponseSchema);
