import { api } from '@/lib/api';

export interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | string;
  departmentId?: {
    _id: string;
    name: string;
  };
  designationId?: {
    _id: string;
    title: string;
    level: number;
  };
  managerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
  };
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  workLocation: 'OFFICE' | 'REMOTE' | 'HYBRID';
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  skills?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    certificateUrl?: string;
  }>;
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
}

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  employmentStatus?: string;
  employmentType?: string;
  workLocation?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const employeeService = {
  list: async (query?: EmployeeQuery): Promise<EmployeeListResponse> => {
    const response = await api.get('/employees', { params: query });
    return response.data.data;
  },

  get: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data.data;
  },

  create: async (data: any): Promise<Employee> => {
    const response = await api.post('/employees', data);
    return response.data.data;
  },

  update: async (id: string, data: any): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  getDirectory: async (query?: { page?: number; limit?: number }): Promise<EmployeeListResponse> => {
    const response = await api.get('/employees/directory', { params: query });
    return response.data.data;
  },

  getHierarchy: async (): Promise<any> => {
    const response = await api.get('/employees/hierarchy');
    return response.data.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/employees/stats/dashboard');
    return response.data.data;
  },

  promote: async (id: string, data: { designationId: string; promotionDate: string; newSalary?: number; notes?: string }): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/promote`, data);
    return response.data.data;
  },

  transfer: async (id: string, data: { departmentId: string; transferDate: string; notes?: string }): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/transfer`, data);
    return response.data.data;
  },

  changeStatus: async (id: string, data: { status: string; date: string; reason?: string }): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/status`, data);
    return response.data.data;
  },

  addSkill: async (id: string, skill: string): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/skills`, { skill });
    return response.data.data;
  },

  removeSkill: async (id: string, skillName: string): Promise<Employee> => {
    const response = await api.delete(`/employees/${id}/skills/${encodeURIComponent(skillName)}`);
    return response.data.data;
  },

  addEducation: async (id: string, education: any): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/education`, education);
    return response.data.data;
  },

  addCertification: async (id: string, certification: any): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/certifications`, certification);
    return response.data.data;
  },

  uploadDocument: async (id: string, document: any): Promise<Employee> => {
    const response = await api.post(`/employees/${id}/documents`, document);
    return response.data.data;
  },

  getTimeline: async (id: string): Promise<any[]> => {
    const response = await api.get(`/activities/employee/${id}/timeline`);
    return response.data.data;
  },
};
