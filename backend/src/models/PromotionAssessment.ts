import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPromotionAssessment extends Document {
  employeeId: mongoose.Types.ObjectId;
  readinessScore: number;
  recommendedLevel: string;
  strengths: string[];
  skillGaps: string[];
  aiSummary: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const promotionAssessmentSchema = new Schema<IPromotionAssessment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true
    },
    readinessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendedLevel: {
      type: String,
      required: true,
      trim: true
    },
    strengths: {
      type: [String],
      default: []
    },
    skillGaps: {
      type: [String],
      default: []
    },
    aiSummary: {
      type: String,
      required: true,
      trim: true
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const PromotionAssessment: Model<IPromotionAssessment> =
  mongoose.models.PromotionAssessment ||
  mongoose.model<IPromotionAssessment>('PromotionAssessment', promotionAssessmentSchema);
