import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISkillAssessment extends Document {
  employeeId: mongoose.Types.ObjectId;
  skillName: string;
  currentLevel: number;
  desiredLevel: number;
  gapScore: number;
  assessedBy: mongoose.Types.ObjectId;
  assessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const skillAssessmentSchema = new Schema<ISkillAssessment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    currentLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    desiredLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    gapScore: {
      type: Number,
      default: 0
    },
    assessedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to calculate gap score automatically
skillAssessmentSchema.pre('save', function (this: any) {
  this.gapScore = Math.max(0, this.desiredLevel - this.currentLevel);
});



export const SkillAssessment: Model<ISkillAssessment> =
  mongoose.models.SkillAssessment ||
  mongoose.model<ISkillAssessment>('SkillAssessment', skillAssessmentSchema);
