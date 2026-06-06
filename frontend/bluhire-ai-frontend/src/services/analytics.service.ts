import { api } from '@/lib/api';

export const getExecutiveAnalytics = async () => {
  const response = await api.get('/analytics/executive');
  return response.data.data;
};
