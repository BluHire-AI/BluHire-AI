import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewScore extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  completenessScore: number;
  overallScore: number;
  weightedScore: number;
  percentile?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewScoreSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
      unique: true, // One final score per session
    },
    technicalScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },
    problemSolvingScore: { type: Number, required: true },
    completenessScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    weightedScore: { type: Number, required: true },
    percentile: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewScore>('InterviewScore', InterviewScoreSchema);
