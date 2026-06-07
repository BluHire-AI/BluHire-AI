import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewQuestion extends Document {
  sessionId: mongoose.Types.ObjectId;
  questionText: string;
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Problem Solving' | 'Project-Based' | 'Resume-Based';
  difficulty: string;
  isFollowUp: boolean;
  parentQuestionId?: mongoose.Types.ObjectId;
  order: number;
  questionVersion: number;
  generatedBy: string;
  generatedAt: Date;
  sourceType: 'Resume' | 'JobDescription' | 'FollowUp' | 'Behavioral' | 'Technical';
  createdAt: Date;
  updatedAt: Date;
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Interview Session ID is required'],
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'Behavioral', 'Situational', 'Problem Solving', 'Project-Based', 'Resume-Based'],
      required: [true, 'Question category is required'],
    },
    difficulty: {
      type: String,
      required: true,
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    parentQuestionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      default: null,
    },
    order: {
      type: Number,
      required: true,
    },
    questionVersion: {
      type: Number,
      default: 1,
    },
    generatedBy: {
      type: String,
      default: 'AI_ENGINE',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    sourceType: {
      type: String,
      enum: ['Resume', 'JobDescription', 'FollowUp', 'Behavioral', 'Technical'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterviewQuestionSchema.index({ sessionId: 1, order: 1 });

export default mongoose.model<IInterviewQuestion>('InterviewQuestion', InterviewQuestionSchema);
