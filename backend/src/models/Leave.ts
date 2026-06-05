import mongoose, { Schema, Document } from 'mongoose';

export enum LeaveType {
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  ANNUAL = 'ANNUAL',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface ILeave extends Document {
  employeeId: string; // Reference to Employee _id
  
  leaveType: LeaveType;
  
  startDate: Date;
  endDate: Date;
  
  reason: string;
  status: LeaveStatus;
  
  approvedBy?: string; // Reference to User _id
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILeave>('Leave', LeaveSchema);
