import { api } from '@/lib/api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  employeeId?: string;
  createdAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export const userService = {
  list: async (query?: { page?: number; limit?: number; search?: string; role?: string }): Promise<UserListResponse> => {
    const response = await api.get('/users', { params: query });
    return response.data.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
