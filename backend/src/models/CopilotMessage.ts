import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICopilotMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: any[];
  timestamp: Date;
}

const copilotMessageSchema = new Schema<ICopilotMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'CopilotConversation', required: true, index: true },
    role: { type: String, enum: ['system', 'user', 'assistant', 'tool'], required: true },
    content: { type: String, required: true },
    name: { type: String },
    toolCalls: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  }
);

copilotMessageSchema.index({ conversationId: 1, timestamp: 1 });

export const CopilotMessage: Model<ICopilotMessage> =
  mongoose.models.CopilotMessage ||
  mongoose.model<ICopilotMessage>('CopilotMessage', copilotMessageSchema);
