"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const KnowledgeDocument_1 = __importStar(require("../../../models/KnowledgeDocument"));
const KnowledgeChunk_1 = __importDefault(require("../../../models/KnowledgeChunk"));
const roles_1 = require("../../../models/roles");
class KnowledgeService {
    aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    /**
     * Helper to compute cosine similarity in JS/TS for local vector search fallback
     */
    cosineSimilarity(vecA, vecB) {
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
    async ingestDocument(docId, filePath, fileName) {
        try {
            console.log("Starting ingestion...");
            console.log("Document ID:", docId);
            await KnowledgeDocument_1.default.findByIdAndUpdate(docId, {
                status: KnowledgeDocument_1.IngestionStatus.PROCESSING,
                updatedAt: new Date()
            });
            const fullPath = path_1.default.resolve(filePath);
            if (!fs_1.default.existsSync(fullPath)) {
                throw new Error(`Document file not found on disk at: ${fullPath}`);
            }
            // 1. Read file and send to FastAPI parser
            const fileBuffer = fs_1.default.readFileSync(fullPath);
            const mimeType = fileName.toLowerCase().endsWith('.docx')
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/pdf';
            const fileBlob = new Blob([fileBuffer], { type: mimeType });
            const formData = new FormData();
            formData.append('file', fileBlob, fileName);
            await KnowledgeDocument_1.default.findByIdAndUpdate(docId, {
                status: KnowledgeDocument_1.IngestionStatus.INDEXING,
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
            await KnowledgeChunk_1.default.deleteMany({ documentId: new mongoose_1.default.Types.ObjectId(docId) });
            // 3. Save new chunks with embeddings
            const chunkRecords = chunks.map((chunk) => ({
                documentId: new mongoose_1.default.Types.ObjectId(docId),
                chunkIndex: chunk.chunkIndex,
                content: chunk.content,
                embedding: chunk.embedding,
                metadata: chunk.metadata || {},
                pageNumber: chunk.pageNumber || 1,
                sectionTitle: chunk.sectionTitle || 'General Content'
            }));
            if (chunkRecords.length > 0) {
                await KnowledgeChunk_1.default.insertMany(chunkRecords);
                console.log("Chunks inserted");
            }
            // 4. Update Document record as INDEXED
            await KnowledgeDocument_1.default.findByIdAndUpdate(docId, {
                status: KnowledgeDocument_1.IngestionStatus.INDEXED,
                chunkCount: chunkRecords.length,
                updatedAt: new Date()
            });
            console.log(`[Knowledge Service] Successfully indexed document ID: ${docId}`);
        }
        catch (error) {
            console.error(`[Knowledge Service] Ingestion failed for document ID ${docId}:`, error);
            await KnowledgeDocument_1.default.findByIdAndUpdate(docId, {
                status: KnowledgeDocument_1.IngestionStatus.FAILED,
                updatedAt: new Date()
            });
        }
    }
    /**
     * Generates embedding for a search query
     */
    async generateEmbedding(query) {
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
    async semanticSearch(query, userRole, limit = 5) {
        try {
            // 1. Generate query embedding
            const queryVector = await this.generateEmbedding(query);
            // 2. Resolve document access boundaries based on user roles
            const accessibleDocIds = [];
            const isEmployee = userRole === roles_1.SystemRoles.EMPLOYEE;
            const docQuery = {};
            if (isEmployee) {
                docQuery.isApprovedForEmployees = true;
            }
            // Only query READY or INDEXED documents
            docQuery.status = { $in: [KnowledgeDocument_1.IngestionStatus.READY, KnowledgeDocument_1.IngestionStatus.INDEXED] };
            const docs = await KnowledgeDocument_1.default.find(docQuery, '_id').lean();
            const docIds = docs.map(d => d._id);
            if (docIds.length === 0) {
                return []; // No accessible documents indexed yet
            }
            // 3. Try MongoDB Atlas Vector Search
            try {
                const atlasResults = await KnowledgeChunk_1.default.aggregate([
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
            }
            catch (err) {
                console.warn(`[Knowledge Service] MongoDB Atlas $vectorSearch command failed: ${err.message}. Invoking local similarity search fallback.`);
            }
            // 4. Cosine Fallback in-memory search
            console.log(`[Knowledge Service] Fetching chunks for local similarity comparison...`);
            const allChunks = await KnowledgeChunk_1.default.find({ documentId: { $in: docIds } })
                .populate('documentId', 'title fileName documentType')
                .lean();
            const scoredChunks = allChunks
                .map((chunk) => {
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
        }
        catch (error) {
            console.error(`[Knowledge Service] Semantic Search failed:`, error.message);
            throw error;
        }
    }
    /**
     * Lists all indexed documents with statistics and filters
     */
    async listDocuments(filter = {}) {
        return await KnowledgeDocument_1.default.find(filter)
            .populate('uploadedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();
    }
    /**
     * Retrieves single document meta
     */
    async getDocumentById(id, filter = {}) {
        return await KnowledgeDocument_1.default.findOne({ _id: id, ...filter })
            .populate('uploadedBy', 'firstName lastName email')
            .lean();
    }
    /**
     * Performs soft deletion by removing chunks from MongoDB, deleting file on disk,
     * and deleting the database document record.
     */
    async deleteDocument(id) {
        const doc = await KnowledgeDocument_1.default.findById(id);
        if (!doc)
            return false;
        // 1. Delete associated chunks from DB
        await KnowledgeChunk_1.default.deleteMany({ documentId: doc._id });
        // 2. Delete file on disk (if it exists)
        const filePath = path_1.default.resolve(doc.filePath);
        if (fs_1.default.existsSync(filePath)) {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (err) {
                console.warn(`[Knowledge Service] Could not delete file from disk: ${filePath}`, err);
            }
        }
        // 3. Delete Document record
        await KnowledgeDocument_1.default.findByIdAndDelete(doc._id);
        return true;
    }
}
exports.KnowledgeService = KnowledgeService;
exports.default = new KnowledgeService();
