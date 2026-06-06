import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewTranscript extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  questionId: string; // Reference to InterviewQuestion _id
  candidateId: string; // Reference to Candidate _id
  transcript: string;
  language?: string; // Language code, e.g., 'en'
  confidence?: number; // Whisper transcription confidence score (0 to 1)
  processingTime?: number; // Time taken to process the transcription in seconds
  createdAt: Date;
  updatedAt: Date;
}

const InterviewTranscriptSchema = new Schema<any>(
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
    transcript: {
      type: String,
      required: [true, 'Transcript text is required'],
    },
    language: {
      type: String,
      default: 'en',
    },
    confidence: {
      type: Number,
      default: null,
    },
    processingTime: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewTranscriptSchema.index({ sessionId: 1, questionId: 1 });
InterviewTranscriptSchema.index({ candidateId: 1 });

export default mongoose.model<IInterviewTranscript>('InterviewTranscript', InterviewTranscriptSchema);
