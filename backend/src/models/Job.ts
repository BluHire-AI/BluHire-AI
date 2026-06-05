import mongoose, { Schema, Document } from 'mongoose';

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ON_HOLD = 'ON_HOLD',
}

export interface IJob extends Document {
  _id: any;
  jobCode: string;
  title: string;
  departmentId: string;
  designationId: string;
  description: string;
  responsibilities: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceRequired: string;
  educationRequired: string;
  employmentType: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  status: JobStatus;
  publishedAt?: Date;
  isDeleted: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<any>(
  {
    jobCode: {
      type: String,
      required: [true, 'Job code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    responsibilities: {
      type: String,
      required: [true, 'Responsibilities description is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      required: [true, 'Required skills are required'],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    experienceRequired: {
      type: String,
      required: [true, 'Experience required is required'],
      trim: true,
    },
    educationRequired: {
      type: String,
      required: [true, 'Education required is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    salaryMin: {
      type: Number,
      default: null,
    },
    salaryMax: {
      type: Number,
      default: null,
    },
    openings: {
      type: Number,
      required: [true, 'Number of openings is required'],
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
JobSchema.index({ jobCode: 1, isDeleted: 1 });
JobSchema.index({ status: 1, isDeleted: 1 });
JobSchema.index({ departmentId: 1, isDeleted: 1 });
JobSchema.index({ designationId: 1, isDeleted: 1 });
JobSchema.index({ createdAt: -1, isDeleted: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
