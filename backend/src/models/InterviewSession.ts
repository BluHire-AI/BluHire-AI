import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  assignmentId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Started' | 'In Progress' | 'Completed' | 'Failed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // duration in seconds
  currentQuestionIndex: number;
  totalQuestions: number;
  skillsExtracted: string[];
  tabSwitchCount: number;
  fullscreenExitCount: number;
  networkDisconnectCount: number;
  suspiciousActivityFlag: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewAssignment',
      required: [true, 'Interview assignment ID is required'],
      index: true,
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
    status: {
      type: String,
      enum: ['Pending', 'Started', 'In Progress', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    skillsExtracted: {
      type: [String],
      default: [],
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    fullscreenExitCount: {
      type: Number,
      default: 0,
    },
    networkDisconnectCount: {
      type: Number,
      default: 0,
    },
    suspiciousActivityFlag: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
