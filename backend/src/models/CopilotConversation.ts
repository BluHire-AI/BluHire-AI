import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICopilotConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sessionId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const copilotConversationSchema = new Schema<ICopilotConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const CopilotConversation: Model<ICopilotConversation> =
  mongoose.models.CopilotConversation ||
  mongoose.model<ICopilotConversation>('CopilotConversation', copilotConversationSchema);
