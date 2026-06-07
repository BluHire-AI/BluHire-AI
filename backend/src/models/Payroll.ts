import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  baseSalary: number;
  allowancesAmount: number;
  bonusesAmount: number;
  overtimeAmount: number;
  deductionsAmount: number;
  taxableIncome: number;
  taxAmount: number;
  netSalary: number;
  isLocked: boolean;
  attendance: {
    workedDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;
    attendancePercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    payrollRunId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    allowancesAmount: {
      type: Number,
      default: 0,
    },
    bonusesAmount: {
      type: Number,
      default: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
    },
    deductionsAmount: {
      type: Number,
      default: 0,
    },
    taxableIncome: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    attendance: {
      workedDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate employee records in a single payroll run
PayrollSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
