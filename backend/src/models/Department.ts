import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  _id: any;
  name: string;
  description?: string;
  departmentHead?: string; // Reference to Employee _id
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<any>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Department name must be at least 2 characters'],
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    departmentHead: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DepartmentSchema.index({ isActive: 1, name: 1 });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
