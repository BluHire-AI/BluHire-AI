import { api } from '@/lib/api';

export interface Job {
  _id: string;
  jobCode: string;
  title: string;
  departmentId?: {
    _id: string;
    name: string;
  };
  designationId?: {
    _id: string;
    title: string;
  };
  description: string;
  responsibilities: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceRequired: string;
  educationRequired: string;
  employmentType: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  openings: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ON_HOLD';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  _id: string;
  candidateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experience?: string;
  education?: string;
  resume?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: string;
  };
  source?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentDesignation?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  candidateId: Candidate;
  jobId: Job;
  employeeId?: any;
  currentStage: 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  status: string;
  appliedAt: string;
  screenedAt?: string;
  interviewedAt?: string;
  offeredAt?: string;
  hiredAt?: string;
  aiScore?: number;
  aiRecommendation?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  screeningSummary?: string;
  screeningStatus?: string;
  interviewStatus?: string;
  interviewScore?: number;
  interviewFeedback?: string;
  interviewCompletedAt?: string;
  recruiterScore?: number;
  notes?: string;
  stageHistory: Array<{
    stage: string;
    changedAt: string;
    changedBy: any;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
}

export interface CandidateListResponse {
  candidates: Candidate[];
  total: number;
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
}

export const recruitmentService = {
  // --- Public Careers Portal APIs ---
  listPublicJobs: async (query?: any): Promise<JobListResponse> => {
    const response = await api.get('/public/recruitment/jobs', { params: query });
    return {
      jobs: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getPublicJob: async (id: string): Promise<Job> => {
    const response = await api.get(`/public/recruitment/jobs/${id}`);
    return response.data.data;
  },

  applyToJob: async (formData: FormData): Promise<Application> => {
    const response = await api.post('/public/recruitment/apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // --- Recruiter Admin Dashboard APIs ---
  listJobs: async (query?: any): Promise<JobListResponse> => {
    const response = await api.get('/recruitment/jobs', { params: query });
    return {
      jobs: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getJob: async (id: string): Promise<Job> => {
    const response = await api.get(`/recruitment/jobs/${id}`);
    return response.data.data;
  },

  createJob: async (data: any): Promise<Job> => {
    const response = await api.post('/recruitment/jobs', data);
    return response.data.data;
  },

  updateJob: async (id: string, data: any): Promise<Job> => {
    const response = await api.patch(`/recruitment/jobs/${id}`, data);
    return response.data.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/recruitment/jobs/${id}`);
  },

  listCandidates: async (query?: any): Promise<CandidateListResponse> => {
    const response = await api.get('/recruitment/candidates', { params: query });
    return {
      candidates: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getCandidate: async (id: string): Promise<Candidate> => {
    const response = await api.get(`/recruitment/candidates/${id}`);
    return response.data.data;
  },

  listApplications: async (query?: any): Promise<ApplicationListResponse> => {
    const response = await api.get('/recruitment/applications', { params: query });
    return {
      applications: response.data.data.data || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  getPipeline: async (jobId?: string): Promise<Record<string, Application[]>> => {
    const response = await api.get('/recruitment/pipeline', { params: { jobId } });
    return response.data.data;
  },

  moveStage: async (id: string, stage: string, notes?: string, onboardingData?: any): Promise<Application> => {
    const response = await api.patch(`/recruitment/applications/${id}/stage`, { 
      stage, 
      notes,
      ...onboardingData
    });
    return response.data.data;
  },

  getAnalytics: async (): Promise<any> => {
    const response = await api.get('/recruitment/analytics');
    return response.data.data;
  },

  getActivities: async (): Promise<any[]> => {
    const response = await api.get('/recruitment/activities');
    return response.data.data;
  },

  getAIAnalytics: async (): Promise<any> => {
    const response = await api.get('/ai/analytics');
    return response.data.data;
  },

  screenApplication: async (applicationId: string): Promise<any> => {
    const response = await api.post('/ai/screen', { applicationId });
    return response.data;
  },

  screenApplicationBulk: async (applicationIds?: string[], jobId?: string): Promise<any> => {
    const response = await api.post('/ai/screen/bulk', { applicationIds, jobId });
    return response.data;
  },

  getScreeningResult: async (applicationId: string): Promise<any> => {
    const response = await api.get(`/ai/screen/${applicationId}`);
    return response.data.data;
  },

  // Helper for generating local secure download url
  getResumeDownloadUrl: (filename: string): string => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    return `${baseURL}/recruitment/resumes/download/${filename}`;
  },

  // Helper to trigger direct secure stream download
  downloadResume: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/recruitment/resumes/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
