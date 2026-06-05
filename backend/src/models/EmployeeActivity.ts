import mongoose, { Schema, Document } from 'mongoose';

export enum ActivityType {
  JOINED = 'JOINED',
  DEPARTMENT_CHANGED = 'DEPARTMENT_CHANGED',
  DESIGNATION_CHANGED = 'DESIGNATION_CHANGED',
  PROMOTION = 'PROMOTION',
  PROMOTED = 'PROMOTED',
  TRANSFERRED = 'TRANSFERRED',
  MANAGER_CHANGED = 'MANAGER_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SALARY_UPDATED = 'SALARY_UPDATED',
  DOCUMENT_ADDED = 'DOCUMENT_ADDED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  SKILL_ADDED = 'SKILL_ADDED',
  SKILL_REMOVED = 'SKILL_REMOVED',
  CERTIFICATION_ADDED = 'CERTIFICATION_ADDED',
  EDUCATION_ADDED = 'EDUCATION_ADDED',
  LEAVE_STARTED = 'LEAVE_STARTED',
  LEAVE_ENDED = 'LEAVE_ENDED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export interface IEmployeeActivity extends Document {
  _id: any;
  employeeId: string; // Reference to Employee _id
  activityType: ActivityType;
  title: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  createdBy: string; // User _id who created this activity
  createdAt: Date;
}

const EmployeeActivitySchema = new Schema<any>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    activityType: {
      type: String,
      enum: Object.values(ActivityType),
      required: [true, 'Activity type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries on employee timeline
EmployeeActivitySchema.index({ employeeId: 1, createdAt: -1 });
EmployeeActivitySchema.index({ activityType: 1, createdAt: -1 });
EmployeeActivitySchema.index({ createdAt: -1 });

export default mongoose.model<IEmployeeActivity>(
  'EmployeeActivity',
  EmployeeActivitySchema
);
