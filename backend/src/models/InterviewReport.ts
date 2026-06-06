import mongoose, { Schema, Document } from 'mongoose';
import { RecommendationDecision } from '../types/interview.types';

export interface IInterviewReport extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  candidateSummary: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  technicalFeedback: string;
  communicationFeedback: string;
  finalRecommendation: RecommendationDecision;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewReportSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
      unique: true, // One final report per session
    },
    candidateSummary: { type: String, required: true },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvementAreas: { type: [String], default: [] },
    technicalFeedback: { type: String, required: true },
    communicationFeedback: { type: String, required: true },
    finalRecommendation: {
      type: String,
      enum: Object.values(RecommendationDecision),
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewReport>('InterviewReport', InterviewReportSchema);
