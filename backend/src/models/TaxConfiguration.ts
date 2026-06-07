import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxSlab {
  minIncome: number;
  maxIncome: number;
  taxRate: number; // Percentage rate, e.g. 10 for 10%
}

export interface ITaxConfiguration extends Document {
  financialYear: string;
  slabs: ITaxSlab[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxSlabSchema = new Schema<ITaxSlab>({
  minIncome: {
    type: Number,
    required: true,
  },
  maxIncome: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    required: true,
  },
});

const TaxConfigurationSchema = new Schema<ITaxConfiguration>(
  {
    financialYear: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slabs: {
      type: [TaxSlabSchema],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITaxConfiguration>('TaxConfiguration', TaxConfigurationSchema);
