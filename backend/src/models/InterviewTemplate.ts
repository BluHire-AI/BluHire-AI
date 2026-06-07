import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewTemplate extends Document {
  name: string;
  jobRole: string;
  department: string;
  experienceLevel: string;
  difficultyLevel: string;
  skillsRequired: string[];
  numQuestions: number;
  timeLimit: number; // in minutes
  interviewType: 'Technical' | 'HR' | 'Behavioral' | 'Mixed';
  maxAttempts: number;
  showResultsToCandidate?: boolean;
  isArchived: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewTemplateSchema = new Schema<IInterviewTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Interview template name is required'],
      trim: true,
      unique: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      trim: true,
    },
    difficultyLevel: {
      type: String,
      required: [true, 'Difficulty level is required'],
      trim: true,
    },
    skillsRequired: {
      type: [String],
      required: [true, 'Skills required lists are required'],
      default: [],
    },
    numQuestions: {
      type: Number,
      required: [true, 'Number of questions is required'],
      min: [1, 'Must have at least 1 question'],
    },
    timeLimit: {
      type: Number,
      required: [true, 'Time limit is required'],
      min: [1, 'Time limit must be at least 1 minute'],
    },
    interviewType: {
      type: String,
      enum: ['Technical', 'HR', 'Behavioral', 'Mixed'],
      default: 'Mixed',
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, 'Max attempts must be at least 1'],
    },
    showResultsToCandidate: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewTemplateSchema.index({ jobRole: 1, isArchived: 1 });

export default mongoose.model<IInterviewTemplate>('InterviewTemplate', InterviewTemplateSchema);
