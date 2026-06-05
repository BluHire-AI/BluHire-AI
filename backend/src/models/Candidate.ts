import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateResume {
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface ICandidate extends Document {
  _id: any;
  candidateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experience?: string;
  education?: string;
  resume?: ICandidateResume;
  source?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentDesignation?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  status: string;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateResumeSchema = new Schema<ICandidateResume>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CandidateSchema = new Schema<any>(
  {
    candidateCode: {
      type: String,
      required: [true, 'Candidate code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: null,
    },
    education: {
      type: String,
      default: null,
    },
    resume: {
      type: CandidateResumeSchema,
      default: null,
    },
    source: {
      type: String,
      default: 'DIRECT',
    },
    linkedinUrl: {
      type: String,
      default: null,
    },
    portfolioUrl: {
      type: String,
      default: null,
    },
    currentCompany: {
      type: String,
      default: null,
    },
    currentDesignation: {
      type: String,
      default: null,
    },
    expectedSalary: {
      type: Number,
      default: null,
    },
    noticePeriod: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: 'APPLIED',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
CandidateSchema.index({ candidateCode: 1, isDeleted: 1 });
CandidateSchema.index({ email: 1, isDeleted: 1 });
CandidateSchema.index({ createdAt: -1, isDeleted: 1 });

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
