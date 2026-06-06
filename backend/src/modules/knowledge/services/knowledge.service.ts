import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import KnowledgeDocument, { DocumentType, IngestionStatus } from '../../../models/KnowledgeDocument';
import KnowledgeChunk from '../../../models/KnowledgeChunk';
import { SystemRoles } from '../../../models/roles';

export class KnowledgeService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

  /**
   * Helper to compute cosine similarity in JS/TS for local vector search fallback
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA === 0 || normB === 0 ? 0.0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Triggers the asynchronous document ingestion pipeline
   */
  async ingestDocument(
    docId: string,
    filePath: string,
    fileName: string
  ): Promise<void> {
    try {
      console.log("Starting ingestion...");
      console.log("Document ID:", docId);
      
      await KnowledgeDocument.findByIdAndUpdate(docId, {
        status: IngestionStatus.PROCESSING,
        updatedAt: new Date()
      });
      
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Document file not found on disk at: ${fullPath}`);
      }

      // 1. Read file and send to FastAPI parser
      const fileBuffer = fs.readFileSync(fullPath);
      const mimeType = fileName.toLowerCase().endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);

      await KnowledgeDocument.findByIdAndUpdate(docId, {
        status: IngestionStatus.INDEXING,
        updatedAt: new Date()
      });

      console.log(`[Knowledge Service] Forwarding to Python parser: ${this.aiServiceUrl}/knowledge/ingest`);
      const response = await fetch(`${this.aiServiceUrl}/knowledge/ingest`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`FastAPI parser failed: ${response.status} - ${errText}`);
      }

      const result = await response.json();
      const chunks = result.chunks || [];
      console.log(`[Knowledge Service] FastAPI parsed document into ${chunks.length} chunks.`);

      // 2. Clear old chunks in case of reindexing
      await KnowledgeChunk.deleteMany({ documentId: new mongoose.Types.ObjectId(docId) });

      // 3. Save new chunks with embeddings
      const chunkRecords = chunks.map((chunk: any) => ({
        documentId: new mongoose.Types.ObjectId(docId),
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata || {},
        pageNumber: chunk.pageNumber || 1,
        sectionTitle: chunk.sectionTitle || 'General Content'
      }));

      if (chunkRecords.length > 0) {
        await KnowledgeChunk.insertMany(chunkRecords);
        console.log("Chunks inserted");
      }

      // 4. Update Document record as INDEXED
      await KnowledgeDocument.findByIdAndUpdate(docId, {
        status: IngestionStatus.INDEXED,
        chunkCount: chunkRecords.length,
        updatedAt: new Date()
      });
      
      console.log(`[Knowledge Service] Successfully indexed document ID: ${docId}`);
    } catch (error: any) {
      console.error(`[Knowledge Service] Ingestion failed for document ID ${docId}:`, error);
      
      await KnowledgeDocument.findByIdAndUpdate(docId, {
        status: IngestionStatus.FAILED,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Generates embedding for a search query
   */
  async generateEmbedding(query: string): Promise<number[]> {
    console.log(`[Knowledge Service] Requesting embedding from FastAPI for query: "${query}"`);
    const response = await fetch(`${this.aiServiceUrl}/knowledge/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI embed service failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * Performs semantic vector search on documents with role-based restriction and local similarity fallback
   */
  async semanticSearch(
    query: string,
    userRole: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // 1. Generate query embedding
      const queryVector = await this.generateEmbedding(query);

      // 2. Resolve document access boundaries based on user roles
      const accessibleDocIds: any[] = [];
      const isEmployee = userRole === SystemRoles.EMPLOYEE;

      const docQuery: any = {};
      if (isEmployee) {
        docQuery.isApprovedForEmployees = true;
      }
      // Only query READY or INDEXED documents
      docQuery.status = { $in: [IngestionStatus.READY, IngestionStatus.INDEXED] };

      const docs = await KnowledgeDocument.find(docQuery, '_id').lean();
      const docIds = docs.map(d => d._id);

      if (docIds.length === 0) {
        return []; // No accessible documents indexed yet
      }

      // 3. Try MongoDB Atlas Vector Search
      try {
        const atlasResults = await KnowledgeChunk.aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: queryVector,
              numCandidates: limit * 10,
              limit: limit
            }
          },
          {
            $match: {
              documentId: { $in: docIds }
            }
          },
          {
            $lookup: {
              from: 'knowledgedocuments',
              localField: 'documentId',
              foreignField: '_id',
              as: 'document'
            }
          },
          {
            $unwind: '$document'
          },
          {
            $project: {
              _id: 1,
              chunkIndex: 1,
              content: 1,
              pageNumber: 1,
              sectionTitle: 1,
              score: { $meta: 'searchScore' },
              'document.title': 1,
              'document.fileName': 1,
              'document.documentType': 1
            }
          }
        ]);

        if (atlasResults && atlasResults.length > 0) {
          console.log(`[Knowledge Service] MongoDB Atlas Vector Search returned ${atlasResults.length} matches.`);
          return atlasResults;
        }
      } catch (err: any) {
        console.warn(`[Knowledge Service] MongoDB Atlas $vectorSearch command failed: ${err.message}. Invoking local similarity search fallback.`);
      }

      // 4. Cosine Fallback in-memory search
      console.log(`[Knowledge Service] Fetching chunks for local similarity comparison...`);
      const allChunks = await KnowledgeChunk.find({ documentId: { $in: docIds } })
        .populate('documentId', 'title fileName documentType')
        .lean();

      const scoredChunks = allChunks
        .map((chunk: any) => {
          const score = this.cosineSimilarity(queryVector, chunk.embedding);
          return {
            _id: chunk._id,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            pageNumber: chunk.pageNumber,
            sectionTitle: chunk.sectionTitle,
            score,
            document: {
              title: chunk.documentId?.title || 'Unknown Title',
              fileName: chunk.documentId?.fileName || 'unknown.pdf',
              documentType: chunk.documentId?.documentType || 'OTHER'
            }
          };
        })
        // Sort by similarity descending
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`[Knowledge Service] Local similarity search returned ${scoredChunks.length} matches.`);
      return scoredChunks;

    } catch (error: any) {
      console.error(`[Knowledge Service] Semantic Search failed:`, error.message);
      throw error;
    }
  }

  /**
   * Lists all indexed documents with statistics and filters
   */
  async listDocuments(filter: any = {}): Promise<any[]> {
    return await KnowledgeDocument.find(filter)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Retrieves single document meta
   */
  async getDocumentById(id: string, filter: any = {}): Promise<any> {
    return await KnowledgeDocument.findOne({ _id: id, ...filter })
      .populate('uploadedBy', 'firstName lastName email')
      .lean();
  }

  /**
   * Performs soft deletion by removing chunks from MongoDB, deleting file on disk,
   * and deleting the database document record.
   */
  async deleteDocument(id: string): Promise<boolean> {
    const doc = await KnowledgeDocument.findById(id);
    if (!doc) return false;

    // 1. Delete associated chunks from DB
    await KnowledgeChunk.deleteMany({ documentId: doc._id });

    // 2. Delete file on disk (if it exists)
    const filePath = path.resolve(doc.filePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`[Knowledge Service] Could not delete file from disk: ${filePath}`, err);
      }
    }

    // 3. Delete Document record
    await KnowledgeDocument.findByIdAndDelete(doc._id);
    return true;
  }
}

export default new KnowledgeService();
