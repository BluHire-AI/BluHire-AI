import mongoose, { Schema, Document } from 'mongoose';

export interface ITechnicalEvaluation extends Document {
  _id: any;
  transcriptId: string; // Reference to InterviewTranscript _id
  technicalAccuracy: number; // 0-10
  conceptUnderstanding: number; // 0-10
  depth: number; // 0-10
  practicalKnowledge: number; // 0-10
  rubricEvaluations: Array<{
    topic: string;
    covered: boolean;
    score: number;
    evidence: string;
  }>;
  overallTechnicalScore: number; // 0-10
  feedback: string; // Textual feedback from AI
  createdAt: Date;
  updatedAt: Date;
}

const TechnicalEvaluationSchema = new Schema<any>(
  {
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewTranscript',
      required: [true, 'Transcript ID is required'],
      index: true,
      unique: true,
    },
    technicalAccuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    conceptUnderstanding: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    depth: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    practicalKnowledge: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    rubricEvaluations: [
      {
        topic: { type: String, required: true },
        covered: { type: Boolean, required: true },
        score: { type: Number, required: true, min: 0, max: 10 },
        evidence: { type: String, required: true },
      }
    ],
    overallTechnicalScore: {
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

export default mongoose.model<ITechnicalEvaluation>('TechnicalEvaluation', TechnicalEvaluationSchema);
