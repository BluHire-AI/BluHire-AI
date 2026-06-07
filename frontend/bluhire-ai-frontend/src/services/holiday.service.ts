import { api } from '@/lib/api';

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  description?: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export const holidayService = {
  list: async (query?: any): Promise<{ data: Holiday[]; total: number }> => {
    const response = await api.get('/holidays', { params: query });
    return {
      data: response.data.data.records || [],
      total: response.data.data.total || 0,
    };
  },

  getById: async (id: string): Promise<Holiday> => {
    const response = await api.get(`/holidays/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<Holiday> => {
    const response = await api.post('/holidays', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Holiday> => {
    const response = await api.put(`/holidays/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/holidays/${id}`);
  },
};
