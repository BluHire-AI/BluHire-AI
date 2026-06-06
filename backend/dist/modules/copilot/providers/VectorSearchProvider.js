"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchProvider = void 0;
const knowledge_service_1 = __importDefault(require("../../knowledge/services/knowledge.service"));
class VectorSearchProvider {
    name = 'vector-search-provider';
    /**
     * Safe MongoDB query helper enforcing page size limits (max 100)
     */
    async query(target, filter = {}, limit = 5) {
        const role = filter?.role || 'EMPLOYEE';
        const cleanLimit = Math.min(50, Math.max(1, limit || 5));
        return await knowledge_service_1.default.semanticSearch(target, role, cleanLimit);
    }
    /**
     * Run semantic search queries
     */
    async semanticSearch(query, role = 'EMPLOYEE') {
        return await knowledge_service_1.default.semanticSearch(query, role, 5);
    }
    /**
     * Retrieve chunks with embeddings
     */
    async retrieveChunks(query, role = 'EMPLOYEE', limit = 5) {
        return await knowledge_service_1.default.semanticSearch(query, role, limit);
    }
    /**
     * Retrieve document metadata
     */
    async getDocumentById(id) {
        return await knowledge_service_1.default.getDocumentById(id);
    }
}
exports.VectorSearchProvider = VectorSearchProvider;
exports.default = new VectorSearchProvider();
