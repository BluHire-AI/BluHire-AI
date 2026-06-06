import { api } from '@/lib/api';

export interface OverviewStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalHires: number;
  totalRejections: number;
  conversionRate: number;
  averageTimeToHire: number;
}

export interface FunnelStats {
  counts: Record<string, number>;
  conversionRates: Record<string, number>;
  dropOffs: Record<string, number>;
  efficiency: number;
}

export interface AIScreeningStats {
  totalScreened: number;
  averageMatchScore: number;
  recommended: number;
  needsReview: number;
  notRecommended: number;
  scoreDistribution: Array<{ bin: string; count: number }>;
}

export interface AIInterviewStats {
  interviewsScheduled: number;
  interviewsCompleted: number;
  averageInterviewScore: number;
  passRate: number;
  failureRate: number;
  topPerformingCandidates: Array<{
    applicationId: string;
    candidateName: string;
    candidateCode: string;
    candidateEmail: string;
    jobTitle: string;
    jobCode: string;
    interviewScore: number;
    aiScore: number;
  }>;
}

export interface RecruiterPerformance {
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  candidatesProcessed: number;
  interviewsConducted: number;
  offersReleased: number;
  hiresCompleted: number;
  conversionRate: number;
  averageTimeToHire: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  applicationsReceived: number;
  interviewsConducted: number;
  hires: number;
  averageHiringTime: number;
  openJobs: number;
}

export interface JobPerformance {
  jobId: string;
  jobCode: string;
  jobTitle: string;
  departmentName: string;
  applications: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hires: number;
  rejections: number;
}

export interface SkillsIntelligence {
  requestedSkills: Array<{ skill: string; count: number }>;
  availableSkills: Array<{ skill: string; count: number }>;
  skillGap: Array<{
    skill: string;
    demandCount: number;
    supplyCount: number;
    demandPct: number;
    supplyPct: number;
    gap: number;
  }>;
  shortages: Array<any>;
  emerging: Array<any>;
}

export interface ActivityStats {
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ week: string; count: number }>;
  monthly: Array<{ month: string; count: number }>;
  hiringTrends: Array<{ month: string; count: number }>;
  recruitmentVelocity: Record<string, number>;
}

export const analyticsService = {
  getExecutiveAnalytics: async () => {
    const response = await api.get('/analytics/executive');
    return response.data.data;
  },

  getOverview: async (query?: any): Promise<OverviewStats> => {
    const response = await api.get('/analytics/recruitment/overview', { params: query });
    return response.data.data;
  },

  getFunnel: async (query?: any): Promise<FunnelStats> => {
    const response = await api.get('/analytics/recruitment/funnel', { params: query });
    return response.data.data;
  },

  getAIScreening: async (query?: any): Promise<AIScreeningStats> => {
    const response = await api.get('/analytics/ai-screening', { params: query });
    return response.data.data;
  },

  getInterviews: async (query?: any): Promise<AIInterviewStats> => {
    const response = await api.get('/analytics/interviews', { params: query });
    return response.data.data;
  },

  getRecruiters: async (query?: any): Promise<RecruiterPerformance[]> => {
    const response = await api.get('/analytics/recruiters', { params: query });
    return response.data.data;
  },

  getDepartments: async (query?: any): Promise<DepartmentStats[]> => {
    const response = await api.get('/analytics/departments', { params: query });
    return response.data.data;
  },

  getJobs: async (query?: any): Promise<{ data: JobPerformance[]; total: number }> => {
    const response = await api.get('/analytics/jobs', { params: query });
    return {
      data: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getSkills: async (query?: any): Promise<SkillsIntelligence> => {
    const response = await api.get('/analytics/skills', { params: query });
    return response.data.data;
  },

  getActivity: async (query?: any): Promise<ActivityStats> => {
    const response = await api.get('/analytics/activity', { params: query });
    return response.data.data;
  },

  /**
   * Directly triggers download for a report by fetching binary blob from the backend
   */
  downloadReport: async (report: string, format: string, query?: any): Promise<void> => {
    const response = await api.get('/analytics/export', {
      params: { ...query, report, format },
      responseType: 'blob',
    });

    // Extract filename from headers if possible, otherwise use a fallback
    const disposition = response.headers['content-disposition'];
    let filename = `hrminds_${report}_report_${new Date().toISOString().slice(0, 10)}`;
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    } else {
      const ext = format === 'pdf' ? 'html' : 'csv'; // format pdf returns printable html page
      filename += `.${ext}`;
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
export default analyticsService;
