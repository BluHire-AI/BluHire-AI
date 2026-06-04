import { api } from '@/lib/api';

export interface Designation {
  _id: string;
  title: string;
  code: string;
  description?: string;
  departmentId: {
    _id: string;
    name: string;
  } | string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationListResponse {
  designations: Designation[];
  total: number;
}

export const designationService = {
  list: async (query?: { page?: number; limit?: number; search?: string }): Promise<DesignationListResponse> => {
    const response = await api.get('/designations', { params: query });
    return {
      designations: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getAll: async (): Promise<Designation[]> => {
    const response = await api.get('/designations/all');
    return response.data.data;
  },

  get: async (id: string): Promise<Designation> => {
    const response = await api.get(`/designations/${id}`);
    return response.data.data;
  },

  getByDepartment: async (departmentId: string): Promise<DesignationListResponse> => {
    const response = await api.get(`/designations/by-department/${departmentId}`);
    return {
      designations: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getLevels: async (): Promise<number[]> => {
    const response = await api.get('/designations/levels');
    return response.data.data;
  },

  create: async (data: any): Promise<Designation> => {
    const response = await api.post('/designations', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Designation> => {
    const response = await api.put(`/designations/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/designations/${id}`);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/designations/stats/dashboard');
    return response.data.data;
  },
};
