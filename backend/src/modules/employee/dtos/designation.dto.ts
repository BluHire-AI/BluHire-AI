// Create Designation DTO
export interface CreateDesignationDTO {
  title: string;
  description?: string;
  departmentId: string;
  level: number;
}

// Update Designation DTO
export interface UpdateDesignationDTO {
  title?: string;
  description?: string;
  departmentId?: string;
  level?: number;
}

// Designation Query DTO
export interface DesignationQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  level?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Designation Level Enum
export const DESIGNATION_LEVELS = {
  1: 'Entry Level',
  2: 'Mid Level',
  3: 'Senior',
  4: 'Lead',
  5: 'Manager',
  6: 'Director',
  7: 'Executive',
} as const;
