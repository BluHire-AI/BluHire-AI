import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunicationAnalysis extends Document {
  _id: any;
  transcriptId: string;
  communicationScore: number;
  clarityScore: number;
  fillerWordCount: number;
  grammarScore: number;
  vocabularyScore: number;
  feedback: string;
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
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICommunicationAnalysis>('CommunicationAnalysis', CommunicationAnalysisSchema);
