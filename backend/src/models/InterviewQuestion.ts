import mongoose, { Schema, Document } from 'mongoose';
import { Difficulty, QuestionCategory } from '../types/interview.types';

export interface IInterviewQuestion extends Document {
  _id: any;
  templateId: string; // Reference to InterviewTemplate _id
  questionText: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  expectedTopics: string[];
  generatedByAI: boolean;
  createdAt: Date;
}

const InterviewQuestionSchema = new Schema<any>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      required: [true, 'Template ID is required'],
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(QuestionCategory),
      required: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(Difficulty),
      required: true,
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
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt specified in requirements, but we can leave timestamps: true or just createdAt
  }
);

// Indexes
InterviewQuestionSchema.index({ templateId: 1 });
InterviewQuestionSchema.index({ category: 1 });
InterviewQuestionSchema.index({ difficulty: 1 });

export default mongoose.model<IInterviewQuestion>('InterviewQuestion', InterviewQuestionSchema);
