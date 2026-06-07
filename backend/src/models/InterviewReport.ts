import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewReport extends Document {
  sessionId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  overallScore: number;
  technicalAnalysis: string;
  communicationAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'Weak Consider' | 'Reject';
  recommendationReasoning: string;
  transcriptSummary: string;
  skillsBreakdown: Record<string, number>;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewReportSchema = new Schema<IInterviewReport>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Interview Session ID is required'],
      index: true,
      unique: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    technicalAnalysis: {
      type: String,
      default: '',
    },
    communicationAnalysis: {
      type: String,
      default: '',
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    hiringRecommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Consider', 'Weak Consider', 'Reject'],
      required: true,
    },
    recommendationReasoning: {
      type: String,
      default: '',
    },
    transcriptSummary: {
      type: String,
      default: '',
    },
    skillsBreakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInterviewReport>('InterviewReport', InterviewReportSchema);
