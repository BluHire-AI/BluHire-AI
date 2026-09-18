import mongoose, { Schema, Document } from 'mongoose';
import { Difficulty, QuestionCategory } from '../types/interview.types';

export interface IInterviewQuestion extends Document {
  _id: any;
  sessionId?: string; // Reference to InterviewSession _id
  jobId?: string; // Reference to Job _id
  templateId?: string; // Reference to InterviewTemplate _id (Legacy fallback)
  questionText: string;
  category: QuestionCategory | string;
  competency?: string;
  difficulty: Difficulty | string;
  reason?: string;
  sourceSkill?: string;
  expectedTopics: string[];
  generatedByAI: boolean;
  createdAt: Date;
}

const InterviewQuestionSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'TECHNICAL',
    },
    competency: {
      type: String,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      default: 'INTERMEDIATE',
    },
    reason: {
      type: String,
      trim: true,
    },
    sourceSkill: {
      type: String,
      trim: true,
    },
    expectedTopics: {
      type: [String],
      default: [],
    },
    generatedByAI: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
InterviewQuestionSchema.index({ category: 1 });
InterviewQuestionSchema.index({ difficulty: 1 });

export default mongoose.model<IInterviewQuestion>('InterviewQuestion', InterviewQuestionSchema);
