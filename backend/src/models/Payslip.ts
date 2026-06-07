import mongoose, { Schema, Document } from 'mongoose';

export interface IPayslip extends Document {
  payrollId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  payslipCode: string;
  salarySnapshot: {
    employeeName: string;
    employeeCode: string;
    baseSalary: number;
    hra: number;
    medical: number;
    travel: number;
    special: number;
    otherAllowance: number;
    bonuses: number;
    pf: number;
    insurance: number;
    deductions: number;
    taxableIncome: number;
    taxAmount: number;
    grossSalary: number;
    netSalary: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    payrollId: {
      type: Schema.Types.ObjectId,
      ref: 'Payroll',
      required: true,
      unique: true,
      index: true,
    },
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
    payslipCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    salarySnapshot: {
      employeeName: { type: String, required: true },
      employeeCode: { type: String, required: true },
      baseSalary: { type: Number, required: true, default: 0 },
      hra: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      otherAllowance: { type: Number, default: 0 },
      bonuses: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      taxableIncome: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      grossSalary: { type: Number, required: true, default: 0 },
      netSalary: { type: Number, required: true, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayslip>('Payslip', PayslipSchema);
