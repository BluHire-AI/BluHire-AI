import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICopilotAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  toolsUsed: Array<{
    name: string;
    arguments: any;
    durationMs: number;
    status: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  }>;
  response: string;
  timestamp: Date;
}

const copilotAuditLogSchema = new Schema<ICopilotAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prompt: { type: String, required: true },
    toolsUsed: [
      {
        name: { type: String, required: true },
        arguments: { type: Schema.Types.Mixed },
        durationMs: { type: Number, required: true },
        status: { type: String, enum: ['SUCCESS', 'FAILED', 'UNAUTHORIZED'], required: true }
      }
    ],
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
  }
);

export const CopilotAuditLog: Model<ICopilotAuditLog> =
  mongoose.models.CopilotAuditLog ||
  mongoose.model<ICopilotAuditLog>('CopilotAuditLog', copilotAuditLogSchema);
