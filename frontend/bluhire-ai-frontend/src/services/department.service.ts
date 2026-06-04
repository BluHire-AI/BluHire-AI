import { api } from '@/lib/api';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headId?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentListResponse {
  departments: Department[];
  total: number;
}

export const departmentService = {
  list: async (query?: { page?: number; limit?: number; search?: string }): Promise<DepartmentListResponse> => {
    const response = await api.get('/departments', { params: query });
    return {
      departments: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  get: async (id: string): Promise<Department> => {
    const response = await api.get(`/departments/${id}`);
    return response.data.data;
  },

  getActive: async (): Promise<Department[]> => {
    const response = await api.get('/departments/active');
    return response.data.data;
  },

  create: async (data: any): Promise<Department> => {
    const response = await api.post('/departments', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },

  assignHead: async (id: string, employeeId: string): Promise<Department> => {
    const response = await api.post(`/departments/${id}/head`, { employeeId });
    return response.data.data;
  },

  removeHead: async (id: string): Promise<Department> => {
    const response = await api.delete(`/departments/${id}/head`);
    return response.data.data;
  },

  toggleStatus: async (id: string): Promise<Department> => {
    const response = await api.patch(`/departments/${id}/toggle-status`);
    return response.data.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/departments/stats/dashboard');
    return response.data.data;
  },
};
