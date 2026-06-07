import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceSummary extends Document {
  employeeId: mongoose.Types.ObjectId; // Reference to Employee _id
  
  month: number; // 1-12
  year: number;
  
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  halfDays: number;
  holidayDays: number;
  weekendDays: number;
  
  totalHours: number;
  overtimeHours: number;
  totalWorkingDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  
  attendancePercentage: number;
  
  generatedAt: Date;
}

const AttendanceSummarySchema = new Schema<IAttendanceSummary>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    holidayDays: {
      type: Number,
      default: 0,
    },
    weekendDays: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    totalWorkingDays: {
      type: Number,
      default: 0,
    },
    totalWorkingHours: {
      type: Number,
      default: 0,
    },
    totalOvertimeHours: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one summary per employee per month/year
AttendanceSummarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IAttendanceSummary>('AttendanceSummary', AttendanceSummarySchema);
