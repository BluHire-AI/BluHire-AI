import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISuccessorCandidate {
  employeeId: mongoose.Types.ObjectId;
  readinessScore: number;
  recommendedTimeline: string;
  suitabilityReasons: string[];
}

export interface ISuccessionPlan extends Document {
  position: string;
  currentEmployee?: mongoose.Types.ObjectId;
  successorCandidates: ISuccessorCandidate[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const successorCandidateSchema = new Schema<ISuccessorCandidate>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    readinessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendedTimeline: {
      type: String,
      required: true
    },
    suitabilityReasons: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const successionPlanSchema = new Schema<ISuccessionPlan>(
  {
    position: {
      type: String,
      required: true,
      index: true
    },
    currentEmployee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },
    successorCandidates: {
      type: [successorCandidateSchema],
      default: []
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const SuccessionPlan: Model<ISuccessionPlan> =
  mongoose.models.SuccessionPlan ||
  mongoose.model<ISuccessionPlan>('SuccessionPlan', successionPlanSchema);
