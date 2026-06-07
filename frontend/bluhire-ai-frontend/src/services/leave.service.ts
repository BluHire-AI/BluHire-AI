import { api } from '@/lib/api';

export interface Leave {
  _id: string;
  employeeId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const leaveService = {
  list: async (query?: any): Promise<{ data: Leave[]; total: number }> => {
    const response = await api.get('/leaves', { params: query });
    return {
      data: response.data.data.records || [],
      total: response.data.data.total || 0,
    };
  },

  getById: async (id: string): Promise<Leave> => {
    const response = await api.get(`/leaves/${id}`);
    return response.data.data;
  },

  apply: async (data: any): Promise<Leave> => {
    const response = await api.post('/leaves', data);
    return response.data.data;
  },

  approve: async (id: string): Promise<Leave> => {
    const response = await api.post(`/leaves/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string): Promise<Leave> => {
    const response = await api.post(`/leaves/${id}/reject`);
    return response.data.data;
  },

  cancel: async (id: string): Promise<Leave> => {
    const response = await api.post(`/leaves/${id}/cancel`);
    return response.data.data;
  },
};
