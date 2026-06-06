import mongoose, { Schema, Document } from 'mongoose';

export enum DocumentType {
  POLICY = 'POLICY',
  HANDBOOK = 'HANDBOOK',
  SOP = 'SOP',
  TRAINING = 'TRAINING',
  BENEFITS = 'BENEFITS',
  LEAVE = 'LEAVE',
  PAYROLL = 'PAYROLL',
  COMPLIANCE = 'COMPLIANCE',
  OTHER = 'OTHER'
}

export enum IngestionStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  INDEXING = 'INDEXING',
  INDEXED = 'INDEXED',
  READY = 'READY',
  FAILED = 'FAILED'
}

export interface IKnowledgeDocument extends Document {
  title: string;
  fileName: string;
  documentType: DocumentType;
  uploadedBy: mongoose.Types.ObjectId;
  filePath: string;
  fileSize: number;
  status: IngestionStatus;
  chunkCount: number;
  isApprovedForEmployees: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    title: { 
      type: String, 
      required: [true, 'Document title is required'], 
      trim: true 
    },
    fileName: { 
      type: String, 
      required: [true, 'File name is required'] 
    },
    documentType: { 
      type: String, 
      enum: Object.values(DocumentType), 
      required: [true, 'Document type is required'] 
    },
    uploadedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    filePath: { 
      type: String, 
      required: [true, 'File path is required'] 
    },
    fileSize: { 
      type: Number, 
      required: [true, 'File size is required'] 
    },
    status: { 
      type: String, 
      enum: Object.values(IngestionStatus), 
      default: IngestionStatus.PROCESSING 
    },
    chunkCount: { 
      type: Number, 
      default: 0 
    },
    isApprovedForEmployees: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

KnowledgeDocumentSchema.index({ status: 1, documentType: 1 });
KnowledgeDocumentSchema.index({ isApprovedForEmployees: 1 });

export default mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);
