import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewResponse extends Document {
  sessionId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  transcript: string;
  audioFileUrl?: string;
  duration: number; // in seconds
  confidenceScore: number; // speech-to-text confidence score (0-100)
  processingStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  answeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewResponseSchema = new Schema<IInterviewResponse>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Interview Session ID is required'],
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: [true, 'Interview Question ID is required'],
      index: true,
    },
    transcript: {
      type: String,
      default: '',
    },
    audioFileUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    processingStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInterviewResponse>('InterviewResponse', InterviewResponseSchema);
