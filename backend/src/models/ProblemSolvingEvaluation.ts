import mongoose, { Schema, Document } from 'mongoose';

export interface IProblemSolvingEvaluation extends Document {
  _id: any;
  transcriptId: string; // Reference to InterviewTranscript _id
  logicalThinking: number; // 0-10
  approach: number; // 0-10
  tradeoffs: number; // 0-10
  decisionMaking: number; // 0-10
  overallProblemSolvingScore: number; // 0-10
  feedback: string; // Textual feedback from AI
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSolvingEvaluationSchema = new Schema<any>(
  {
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTranscript',
      required: [true, 'Transcript ID is required'],
      index: true,
      unique: true,
    },
    logicalThinking: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    approach: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    tradeoffs: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    decisionMaking: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    overallProblemSolvingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProblemSolvingEvaluation>('ProblemSolvingEvaluation', ProblemSolvingEvaluationSchema);
