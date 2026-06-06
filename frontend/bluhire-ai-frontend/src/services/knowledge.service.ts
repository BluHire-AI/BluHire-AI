import { api } from '@/lib/api';

export interface KnowledgeDocument {
  _id: string;
  title: string;
  fileName: string;
  documentType: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  filePath: string;
  fileSize: number;
  status: 'UPLOADING' | 'PROCESSING' | 'INDEXING' | 'INDEXED' | 'FAILED' | 'READY';
  chunkCount: number;
  isApprovedForEmployees: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  _id: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
  score: number;
  document: {
    title: string;
    fileName: string;
    documentType: string;
  };
}

export interface KnowledgeAnalytics {
  totalDocuments: number;
  totalChunks: number;
  failedProcessingJobs: number;
  averageRetrievalTime: number;
  mostQueriedDocuments: Array<{ id: string; title: string; fileName: string; queries: number }>;
  topSearchTerms: Array<{ term: string; count: number }>;
}

export const knowledgeService = {
  upload: async (
    file: File, 
    title: string, 
    documentType: string, 
    isApprovedForEmployees: boolean
  ): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('documentType', documentType);
    formData.append('isApprovedForEmployees', String(isApprovedForEmployees));

    const response = await api.post('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  list: async (): Promise<KnowledgeDocument[]> => {
    const response = await api.get('/knowledge/documents');
    return response.data.data;
  },

  get: async (id: string): Promise<KnowledgeDocument> => {
    const response = await api.get(`/knowledge/documents/${id}`);
    return response.data.data;
  },

  update: async (
    id: string, 
    data: Partial<Pick<KnowledgeDocument, 'title' | 'documentType' | 'isApprovedForEmployees'>>
  ): Promise<KnowledgeDocument> => {
    const response = await api.patch(`/knowledge/documents/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/knowledge/documents/${id}`);
  },

  reindex: async (id: string): Promise<KnowledgeDocument> => {
    const response = await api.post('/knowledge/reindex', { id });
    return response.data.data;
  },

  search: async (query: string, limit?: number): Promise<SearchResult[]> => {
    console.log('[DEBUG Frontend search] payload:', { query, limit });
    const response = await api.post('/knowledge/search', { query, limit });
    return response.data.data;
  },

  getAnalytics: async (): Promise<KnowledgeAnalytics> => {
    const response = await api.get('/knowledge/analytics');
    return response.data.data;
  },
};
export default knowledgeService;
