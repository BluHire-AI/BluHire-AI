import mongoose, { Document, Schema, Model } from 'mongoose';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface IPerformanceRiskAssessment extends Document {
  employeeId: mongoose.Types.ObjectId;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendation: string;
  assessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const performanceRiskAssessmentSchema = new Schema<IPerformanceRiskAssessment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
      index: true
    },
    reasons: {
      type: [String],
      default: []
    },
    recommendation: {
      type: String,
      default: ''
    },
    assessedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const PerformanceRiskAssessment: Model<IPerformanceRiskAssessment> =
  mongoose.models.PerformanceRiskAssessment ||
  mongoose.model<IPerformanceRiskAssessment>('PerformanceRiskAssessment', performanceRiskAssessmentSchema);
