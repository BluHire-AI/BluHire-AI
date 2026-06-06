import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  pageNumber?: number;
  sectionTitle?: string;
  createdAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    documentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'KnowledgeDocument', 
      required: true, 
      index: true 
    },
    chunkIndex: { 
      type: Number, 
      required: true 
    },
    content: { 
      type: String, 
      required: [true, 'Chunk content is required'] 
    },
    embedding: { 
      type: [Number], 
      required: [true, 'Vector embedding is required'] 
    },
    metadata: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    pageNumber: { 
      type: Number 
    },
    sectionTitle: { 
      type: String 
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

// Compound index for retrieval sorting or ordering
KnowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
