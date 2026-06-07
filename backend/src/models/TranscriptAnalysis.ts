import mongoose, { Schema, Document } from 'mongoose';

export interface ITranscriptAnalysis extends Document {
  _id: any;
  transcriptId: string; // Reference to InterviewTranscript _id
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  technicalKeywordCount: number;
  completenessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptAnalysisSchema = new Schema<any>(
  {
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTranscript',
      required: [true, 'Transcript ID is required'],
      index: true,
      unique: true, // Assuming one analysis per transcript
    },
    wordCount: {
      type: Number,
      required: true,
      default: 0,
    },
    sentenceCount: {
      type: Number,
      required: true,
      default: 0,
    },
    averageSentenceLength: {
      type: Number,
      required: true,
      default: 0,
    },
    technicalKeywordCount: {
      type: Number,
      required: true,
      default: 0,
    },
    completenessScore: {
      type: Number, // Example: 0 to 10 or percentage
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITranscriptAnalysis>('TranscriptAnalysis', TranscriptAnalysisSchema);
