import mongoose, { Document, Schema, Model } from 'mongoose';
import { SystemRoles } from './roles';

export interface IUser extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  phone?: string;
  role: SystemRoles;
  department?: string;
  designation?: string;
  profileImage?: string;
  passwordHash: string;
  isActive: boolean;
  refreshToken?: string;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  passwordResetAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      index: true
    },
    employeeId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    phone: { type: String, trim: true },
    role: { 
      type: String, 
      enum: Object.values(SystemRoles), 
      default: SystemRoles.EMPLOYEE,
      index: true 
    },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    profileImage: { type: String },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String }, // Storing refresh token
    passwordResetOtp: { type: String },
    passwordResetOtpExpires: { type: Date },
    passwordResetAttempts: { type: Number, default: 0 }
  },
  { 
    timestamps: true // Adds createdAt and updatedAt
  }
);

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
