// Create Department DTO
export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  departmentHead?: string;
}

// Update Department DTO
export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  departmentHead?: string;
  isActive?: boolean;
}

// Department Query DTO
export interface DepartmentQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Assign Department Head DTO
export interface AssignDepartmentHeadDTO {
  departmentId: string;
  employeeId: string;
}
