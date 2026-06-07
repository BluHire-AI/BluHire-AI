import mongoose, { Schema, Document } from 'mongoose';
import { RecommendationDecision } from '../types/interview.types';

export interface IInterviewRecommendation extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  recommendation: RecommendationDecision;
  confidence: number; // 0 to 1 or 0 to 100
  reasoning: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewRecommendationSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
      unique: true, // One final recommendation per session
    },
    recommendation: {
      type: String,
      enum: Object.values(RecommendationDecision),
      required: true,
    },
    confidence: { type: Number, required: true },
    reasoning: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewRecommendation>('InterviewRecommendation', InterviewRecommendationSchema);
