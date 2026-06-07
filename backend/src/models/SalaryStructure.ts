import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryStructure extends Document {
  employeeId: mongoose.Types.ObjectId;
  baseSalary: number;
  hra: number;
  medical: number;
  travel: number;
  special: number;
  otherAllowance: number;
  pf: number;
  insurance: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    medical: {
      type: Number,
      default: 0,
    },
    travel: {
      type: Number,
      default: 0,
    },
    special: {
      type: Number,
      default: 0,
    },
    otherAllowance: {
      type: Number,
      default: 0,
    },
    pf: {
      type: Number,
      default: 0, // Employee EPF contribution amount or rate
    },
    insurance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISalaryStructure>('SalaryStructure', SalaryStructureSchema);
