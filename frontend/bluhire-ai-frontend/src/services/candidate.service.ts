import { api } from '../lib/api';

export interface DashboardOverview {
  totalCandidates: number;
  completedInterviews: number;
  underReview: number;
  shortlisted: number;
  rejected: number;
  selected: number;
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await api.get('/dashboard/overview');
  return response.data.data;
};

// We will add the candidate specific endpoints here as well
export const getCandidatesPipeline = async () => {
  const response = await api.get('/candidates');
  return response.data.data;
};

export const getInterviewSessions = async () => {
  const response = await api.get('/interviews/sessions');
  return response.data.data;
};

export const deleteInterviewSession = async (id: string) => {
  const response = await api.delete(`/interviews/${id}`);
  return response.data;
};

export const getCandidateById = async (id: string) => {
  const response = await api.get(`/candidates/${id}`);
  return response.data.data;
};

export const getCandidateReport = async (id: string) => {
  const response = await api.get(`/candidates/${id}/report`);
  return response.data.data;
};

export const getCandidateScorecard = async (id: string) => {
  const response = await api.get(`/candidates/${id}/scorecard`);
  return response.data.data;
};

export const getCandidateMedia = async (id: string) => {
  const response = await api.get(`/candidates/${id}/media`);
  return response.data.data;
};

export const updateCandidateStatus = async (id: string, status: string) => {
  const response = await api.post(`/candidates/${id}/status`, { status });
  return response.data.data;
};

export const getCandidateRankings = async () => {
  const response = await api.get('/candidates/rankings');
  return response.data.data;
};

export const compareCandidates = async (ids: string[]) => {
  const response = await api.get(`/candidates/compare?ids=${ids.join(',')}`);
  return response.data.data;
};
