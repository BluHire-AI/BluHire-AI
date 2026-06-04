import { EmploymentStatus, EmploymentType } from '../../models/Employee';
import { ActivityType } from '../../models/EmployeeActivity';

export interface IEmployeeResponse {
  _id: string;
  employeeCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: Date;
  departmentId: string;
  designationId: string;
  managerId?: string;
  employmentType: EmploymentType;
  joiningDate: Date;
  experience?: number;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
  }>;
  salaryGrade?: string;
  workLocation: string;
  employmentStatus: EmploymentStatus;
  profileImage?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: Date;
  }>;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentResponse {
  _id: string;
  name: string;
  description?: string;
  departmentHead?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesignationResponse {
  _id: string;
  title: string;
  description?: string;
  departmentId: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeActivityResponse {
  _id: string;
  employeeId: string;
  activityType: ActivityType;
  title: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
}

export interface IHierarchyNode {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  designationId: string;
  departmentId: string;
  profileImage?: string;
  children?: IHierarchyNode[];
}

export interface IOrganizationChart {
  rootNode: IHierarchyNode | null;
  totalEmployees: number;
  totalManagers: number;
  totalDepartments: number;
}

export interface IEmployeeDirectory {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  profileImage?: string;
  workLocation: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IFilterOptions {
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  employmentStatus?: EmploymentStatus;
  employmentType?: EmploymentType;
  workLocation?: string;
  search?: string;
}
