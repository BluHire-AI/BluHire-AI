import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunicationAnalysis extends Document {
  _id: any;
  transcriptId: string; // Reference to InterviewTranscript _id
  communicationScore: number;
  clarityScore: number;
  fillerWordCount: number;
  grammarScore: number;
  vocabularyScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationAnalysisSchema = new Schema<any>(
  {
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTranscript',
      required: [true, 'Transcript ID is required'],
      index: true,
      unique: true, // Assuming one analysis per transcript
    },
    communicationScore: {
      type: Number,
      required: true,
      default: 0,
    },
    clarityScore: {
      type: Number,
      required: true,
      default: 0,
    },
    fillerWordCount: {
      type: Number,
      required: true,
      default: 0,
    },
    grammarScore: {
      type: Number,
      required: true,
      default: 0,
    },
    vocabularyScore: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICommunicationAnalysis>('CommunicationAnalysis', CommunicationAnalysisSchema);
