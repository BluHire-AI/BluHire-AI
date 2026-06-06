import mongoose, { Document, Schema, Model } from 'mongoose';

export enum ReviewType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL'
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED'
}

export enum ReviewSource {
  SELF = 'SELF',
  MANAGER = 'MANAGER',
  PEER = 'PEER'
}


export interface IPerformanceReview extends Document {
  reviewCode: string;
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  reviewPeriod: string;
  reviewType: ReviewType;
  reviewSource: ReviewSource;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  leadershipScore: number;
  productivityScore: number;
  teamworkScore: number;
  comments: string;
  strengths: string[];
  weaknesses: string[];
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    reviewCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewPeriod: {
      type: String,
      required: true,
      trim: true
    },
    reviewType: {
      type: String,
      enum: Object.values(ReviewType),
      required: true,
      index: true
    },
    reviewSource: {
      type: String,
      enum: Object.values(ReviewSource),
      default: ReviewSource.MANAGER,
      index: true
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    communicationScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    technicalScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    leadershipScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    productivityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    teamworkScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    comments: {
      type: String,
      required: true,
      trim: true
    },
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.DRAFT,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const PerformanceReview: Model<IPerformanceReview> =
  mongoose.models.PerformanceReview ||
  mongoose.model<IPerformanceReview>('PerformanceReview', performanceReviewSchema);
