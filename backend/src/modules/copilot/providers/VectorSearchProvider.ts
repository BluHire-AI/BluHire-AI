import { KnowledgeProvider } from './KnowledgeProvider';
import knowledgeService from '../../knowledge/services/knowledge.service';

export class VectorSearchProvider implements KnowledgeProvider {
  name = 'vector-search-provider';

  /**
   * Safe MongoDB query helper enforcing page size limits (max 100)
   */
  async query(target: any, filter: any = {}, limit: number = 5): Promise<any[]> {
    const role = filter?.role || 'EMPLOYEE';
    const cleanLimit = Math.min(50, Math.max(1, limit || 5));
    return await knowledgeService.semanticSearch(target, role, cleanLimit);
  }

  /**
   * Run semantic search queries
   */
  async semanticSearch(query: string, role: string = 'EMPLOYEE'): Promise<any[]> {
    return await knowledgeService.semanticSearch(query, role, 5);
  }

  /**
   * Retrieve chunks with embeddings
   */
  async retrieveChunks(query: string, role: string = 'EMPLOYEE', limit: number = 5): Promise<any[]> {
    return await knowledgeService.semanticSearch(query, role, limit);
  }

  /**
   * Retrieve document metadata
   */
  async getDocumentById(id: string): Promise<any> {
    return await knowledgeService.getDocumentById(id);
  }
}

export default new VectorSearchProvider();
