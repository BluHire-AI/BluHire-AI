import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from '../types/interview.types';

export interface ICandidateApplicationStatus extends Document {
  _id: any;
  candidateId: string; // Reference to Candidate/User
  jobId?: string; // Reference to Job (if a job board exists) or Template
  templateId: string; // The interview template applied for
  sessionId?: string; // Reference to InterviewSession (populated once scheduled)
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateApplicationStatusSchema = new Schema<any>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming candidate is stored in the User collection
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    jobId: {
      type: String, // Optional, depending on future phase expansions
      default: null,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      required: [true, 'Template ID is required'],
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.INTERVIEW_SCHEDULED,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICandidateApplicationStatus>('CandidateApplicationStatus', CandidateApplicationStatusSchema);
