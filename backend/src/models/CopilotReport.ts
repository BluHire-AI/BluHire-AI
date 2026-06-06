import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICopilotReport extends Document {
  reportName: string;
  generatedBy: mongoose.Types.ObjectId;
  content: any;
  reportType: string;
  createdAt: Date;
}

const copilotReportSchema = new Schema<ICopilotReport>(
  {
    reportName: { type: String, required: true, trim: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: Schema.Types.Mixed, required: true },
    reportType: { type: String, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CopilotReport: Model<ICopilotReport> =
  mongoose.models.CopilotReport ||
  mongoose.model<ICopilotReport>('CopilotReport', copReportSchemaSchema());

function copReportSchemaSchema() {
  return copilotReportSchema;
}
