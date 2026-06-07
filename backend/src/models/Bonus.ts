import mongoose, { Schema, Document } from 'mongoose';

export interface IBonus extends Document {
  employeeId: mongoose.Types.ObjectId;
  bonusType: 'PERFORMANCE' | 'REFERRAL' | 'FESTIVAL' | 'SPOT' | 'RETENTION';
  amount: number;
  reason: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BonusSchema = new Schema<IBonus>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    bonusType: {
      type: String,
      enum: ['PERFORMANCE', 'REFERRAL', 'FESTIVAL', 'SPOT', 'RETENTION'],
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

export default mongoose.model<IBonus>('Bonus', BonusSchema);
