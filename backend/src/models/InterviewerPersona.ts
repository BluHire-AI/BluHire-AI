import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewerPersona extends Document {
  _id: any;
  name: string;
  role: string;
  tone: string[]; // e.g., ['Professional', 'Friendly', 'Neutral']
  openingMessage: string;
  closingMessage: string;
  voiceSettings?: {
    language?: string;
    pitch?: number;
    rate?: number;
    voiceURI?: string;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewerPersonaSchema = new Schema<any>(
  {
    name: {
      type: String,
      required: [true, 'Persona name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Persona role is required'],
      trim: true,
    },
    tone: {
      type: [String],
      default: ['Professional'],
    },
    openingMessage: {
      type: String,
      required: [true, 'Opening message is required'],
    },
    closingMessage: {
      type: String,
      required: [true, 'Closing message is required'],
    },
    voiceSettings: {
      language: { type: String, default: 'en-US' },
      pitch: { type: Number, default: 1.0 },
      rate: { type: Number, default: 1.0 },
      voiceURI: { type: String, default: null }, // Maps to window.speechSynthesis voices
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default persona can exist easily (or handle via pre-save hook)
InterviewerPersonaSchema.pre('save', async function () {
  if (this.isDefault) {
    // Set all other personas to isDefault: false
    await mongoose.models.InterviewerPersona.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

export default mongoose.model<IInterviewerPersona>('InterviewerPersona', InterviewerPersonaSchema);
