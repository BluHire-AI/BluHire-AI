import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRun extends Document {
  month: number; // 1 to 12
  year: number;
  status: 'PENDING' | 'GENERATED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID';
  isLocked: boolean;
  totalCost: number;
  employeesCount: number;
  processedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
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
    status: {
      type: String,
      enum: ['PENDING', 'GENERATED', 'UNDER_REVIEW', 'APPROVED', 'PAID'],
      default: 'PENDING',
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    employeesCount: {
      type: Number,
      default: 0,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Monthly run uniqueness index
PayrollRunSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
