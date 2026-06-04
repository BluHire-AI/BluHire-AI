import { ActivityType } from '../../../models/EmployeeActivity';

// Create Employee Activity DTO
export interface CreateEmployeeActivityDTO {
  employeeId: string;
  activityType: ActivityType;
  title: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

// Employee Activity Query DTO
export interface EmployeeActivityQueryDTO {
  employeeId?: string;
  activityType?: ActivityType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

// Activity Timeline Response DTO
export interface ActivityTimelineDTO {
  activities: Array<{
    _id: string;
    activityType: ActivityType;
    title: string;
    description: string;
    createdAt: Date;
    createdBy: string;
  }>;
  total: number;
}
