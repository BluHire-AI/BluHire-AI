import mongoose, { Document, Schema, Model } from 'mongoose';

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface IEmployeeGoal extends Document {
  goalCode: string;
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  priority: GoalPriority;
  targetDate: Date;
  progressPercentage: number;
  weightage: number;
  status: GoalStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeGoalSchema = new Schema<IEmployeeGoal>(
  {
    goalCode: {
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    priority: {
      type: String,
      enum: Object.values(GoalPriority),
      default: GoalPriority.MEDIUM,
      index: true
    },
    targetDate: {
      type: Date,
      required: true
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    weightage: {
      type: Number,
      default: 100,
      min: 1,
      max: 100
    },
    status: {
      type: String,
      enum: Object.values(GoalStatus),
      default: GoalStatus.NOT_STARTED,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const EmployeeGoal: Model<IEmployeeGoal> =
  mongoose.models.EmployeeGoal ||
  mongoose.model<IEmployeeGoal>('EmployeeGoal', employeeGoalSchema);
