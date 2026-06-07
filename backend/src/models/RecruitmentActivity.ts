import mongoose, { Schema, Document } from 'mongoose';

export enum RecruitmentActivityType {
  JOB_CREATED = 'JOB_CREATED',
  JOB_CLOSED = 'JOB_CLOSED',
  CANDIDATE_APPLIED = 'CANDIDATE_APPLIED',
  CANDIDATE_SHORTLISTED = 'CANDIDATE_SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  CANDIDATE_HIRED = 'CANDIDATE_HIRED',
  STAGE_CHANGED = 'STAGE_CHANGED',
}

export interface IRecruitmentActivity extends Document {
  _id: any;
  applicationId?: string;
  candidateId?: string;
  jobId?: string;
  title: RecruitmentActivityType;
  description: string;
  createdBy?: string; // Reference to User ID
  createdAt: Date;
  updatedAt: Date;
}

const RecruitmentActivitySchema = new Schema<any>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },
    title: {
      type: String,
      enum: Object.values(RecruitmentActivityType),
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RecruitmentActivitySchema.index({ createdAt: -1 });

export default mongoose.model<IRecruitmentActivity>('RecruitmentActivity', RecruitmentActivitySchema);
