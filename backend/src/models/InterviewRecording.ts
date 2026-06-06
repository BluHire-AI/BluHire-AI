import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewRecording extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  candidateId: string; // Reference to Candidate _id
  questionId: string; // Reference to InterviewQuestion _id
  videoUrl: string;
  duration?: number; // Duration in seconds
  fileSize?: number; // File size in bytes
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewRecordingSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: [true, 'Question ID is required'],
      index: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    duration: {
      type: Number,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewRecordingSchema.index({ sessionId: 1, questionId: 1 });
InterviewRecordingSchema.index({ candidateId: 1 });

export default mongoose.model<IInterviewRecording>('InterviewRecording', InterviewRecordingSchema);
