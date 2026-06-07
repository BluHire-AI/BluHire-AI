import mongoose, { Schema, Document } from 'mongoose';
import { Difficulty, TemplateStatus, QuestionCategory } from '../types/interview.types';


export interface IInterviewTemplate extends Document {
  _id: any;
  title: string;
  jobRole: string;
  departmentId: string; // Reference to Department _id
  experienceLevel: string; // e.g., "0-2", "3-5", "5+"
  skills: string[];
  difficulty: Difficulty;
  questionCount: number;
  durationMinutes: number;
  categories: QuestionCategory[];
  status: TemplateStatus;
  createdBy: string; // User _id
  updatedBy?: string; // User _id
  createdAt: Date;
  updatedAt: Date;
}

const InterviewTemplateSchema = new Schema<any>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      trim: true,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    difficulty: {
      type: String,
      enum: Object.values(Difficulty),
      required: true,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    categories: {
      type: [String],
      enum: Object.values(QuestionCategory),
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(TemplateStatus),
      default: TemplateStatus.DRAFT,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewTemplateSchema.index({ departmentId: 1, status: 1 });
InterviewTemplateSchema.index({ createdAt: -1 });

export default mongoose.model<IInterviewTemplate>('InterviewTemplate', InterviewTemplateSchema);
