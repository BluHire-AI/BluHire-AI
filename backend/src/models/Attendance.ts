import mongoose, { Schema, Document } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEKEND = 'WEEKEND',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
}

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId; // Reference to Employee _id
  date: Date;
  
  checkInTime?: Date;
  checkOutTime?: Date;
  
  totalHours: number;
  workingHours: number;
  overtimeHours: number;
  breakDuration: number;
  
  attendanceStatus: AttendanceStatus;
  
  remarks?: string;
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;

  // AI Compatibility fields
  attendancePatternScore?: number;
  riskFlags?: string[];
  behaviorMetrics?: Record<string, any>;

  createdBy: mongoose.Types.ObjectId; // User _id
  updatedBy?: mongoose.Types.ObjectId; // User _id
  
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    workingHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    breakDuration: {
      type: Number,
      default: 0,
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.ABSENT,
      index: true,
    },
    remarks: {
      type: String,
    },
    location: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    deviceInfo: {
      type: String,
    },
    attendancePatternScore: {
      type: Number,
    },
    riskFlags: {
      type: [String],
    },
    behaviorMetrics: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, attendanceStatus: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
