import mongoose, { Schema, Document } from 'mongoose';

export interface IDeduction extends Document {
  employeeId: mongoose.Types.ObjectId;
  deductionType: 'TAX' | 'PF' | 'INSURANCE' | 'PENALTY' | 'LATE' | 'OTHER';
  amount: number;
  reason: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeductionSchema = new Schema<IDeduction>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    deductionType: {
      type: String,
      enum: ['TAX', 'PF', 'INSURANCE', 'PENALTY', 'LATE', 'OTHER'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDeduction>('Deduction', DeductionSchema);
