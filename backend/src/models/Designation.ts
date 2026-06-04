import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
  _id: any;
  title: string;
  description?: string;
  departmentId: string; // Reference to Department _id
  level: number; // 1 = Entry Level, 2 = Mid Level, 3 = Senior, 4 = Lead, 5 = Manager, 6 = Director, 7 = Executive
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<any>(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    level: {
      type: Number,
      required: [true, 'Designation level is required'],
      enum: [1, 2, 3, 4, 5, 6, 7],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint on title and department
DesignationSchema.index({ title: 1, departmentId: 1 }, { unique: true });
DesignationSchema.index({ departmentId: 1, level: 1 });

export default mongoose.model<IDesignation>('Designation', DesignationSchema);
