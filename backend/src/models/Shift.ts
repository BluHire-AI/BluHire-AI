import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string; // Time string e.g., "09:00"
  endTime: string;   // Time string e.g., "18:00"
  gracePeriodMinutes: number;
  workingHoursPerDay: number;
  isFlexible: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):?([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):?([0-5]\d)$/,
    },
    gracePeriodMinutes: {
      type: Number,
      default: 15,
    },
    workingHoursPerDay: {
      type: Number,
      default: 8,
    },
    isFlexible: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IShift>('Shift', ShiftSchema);
