import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewEvaluation extends Document {
  sessionId: mongoose.Types.ObjectId;
  responseId: mongoose.Types.ObjectId;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number; // Candidate's confidence level
  clarityScore: number;
  problemSolvingScore: number;
  domainExpertiseScore: number;
  relevanceScore: number;
  depthOfUnderstandingScore: number;
  overallScore: number;
  aiConfidenceScore: number; // AI evaluation scoring confidence float (0-1.0)
  reasoning: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewEvaluationSchema = new Schema<IInterviewEvaluation>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Interview Session ID is required'],
      index: true,
    },
    responseId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewResponse',
      required: [true, 'Interview Response ID is required'],
      index: true,
    },
    technicalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    communicationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    clarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    problemSolvingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    domainExpertiseScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    relevanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    depthOfUnderstandingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    aiConfidenceScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1.0,
    },
    reasoning: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInterviewEvaluation>('InterviewEvaluation', InterviewEvaluationSchema);
