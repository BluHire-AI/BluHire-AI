import { EmploymentStatus, EmploymentType } from '../../../models/Employee';

// Create Employee DTO
export interface CreateEmployeeDTO {
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
  salaryGrade?: string;
  workLocation: string;
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
  notes?: string;
}

// Update Employee DTO (partial)
export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  experience?: number;
  skills?: string[];
  salaryGrade?: string;
  workLocation?: string;
  employmentStatus?: EmploymentStatus;
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
  notes?: string;
}

// Batch Employee Update DTO
export interface BatchUpdateEmployeeDTO {
  employeeIds: string[];
  updates: UpdateEmployeeDTO;
}

// Employee Query Filters
export interface EmployeeQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  employmentStatus?: EmploymentStatus;
  employmentType?: EmploymentType;
  workLocation?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Upload Document DTO
export interface UploadDocumentDTO {
  employeeId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

// Add Skill DTO
export interface AddSkillDTO {
  employeeId: string;
  skill: string;
}

// Remove Skill DTO
export interface RemoveSkillDTO {
  employeeId: string;
  skill: string;
}

// Add Education DTO
export interface AddEducationDTO {
  employeeId: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
}

// Add Certification DTO
export interface AddCertificationDTO {
  employeeId: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
}

// Promote Employee DTO
export interface PromoteEmployeeDTO {
  employeeId: string;
  designationId: string;
  departmentId?: string;
  salaryGrade?: string;
}

// Transfer Employee DTO
export interface TransferEmployeeDTO {
  employeeId: string;
  departmentId: string;
  designationId?: string;
  managerId?: string;
}

// Change Status DTO
export interface ChangeStatusDTO {
  employeeId: string;
  employmentStatus: EmploymentStatus;
  reason?: string;
  effectiveDate?: Date;
}

// Bulk Import DTO
export interface BulkImportEmployeeDTO {
  employees: CreateEmployeeDTO[];
}
