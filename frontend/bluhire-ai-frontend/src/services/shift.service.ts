import { api } from '@/lib/api';

export interface Shift {
  _id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  gracePeriodMinutes: number;
  workingHoursPerDay: number;
  isFlexible: boolean;
  createdAt: string;
  updatedAt: string;
}

export const shiftService = {
  list: async (): Promise<Shift[]> => {
    const response = await api.get('/shifts');
    return response.data.data;
  },

  getById: async (id: string): Promise<Shift> => {
    const response = await api.get(`/shifts/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<Shift> => {
    const response = await api.post('/shifts', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Shift> => {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/shifts/${id}`);
  },
};
