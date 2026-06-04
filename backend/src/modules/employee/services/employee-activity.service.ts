import { IEmployeeActivity, ActivityType } from '../../../models/EmployeeActivity';
import EmployeeActivityRepository from '../repositories/employee-activity.repository';
import EmployeeRepository from '../repositories/employee.repository';
import {
  CreateEmployeeActivityDTO,
  EmployeeActivityQueryDTO,
} from '../dtos/employee-activity.dto';
import { PaginationDTO, createPaginatedResponse } from '../dtos/common.dto';

export class EmployeeActivityService {
  /**
   * Create a new activity record (internal use)
   */
  async createActivity(
    activityData: CreateEmployeeActivityDTO
  ): Promise<IEmployeeActivity> {
    // Verify employee exists
    const employee = await EmployeeRepository.findById(activityData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    return await EmployeeActivityRepository.create(activityData);
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<IEmployeeActivity> {
    const activity = await EmployeeActivityRepository.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    return activity;
  }

  /**
   * Get employee timeline/activities
   */
  async getEmployeeTimeline(
    employeeId: string,
    limit: number = 50
  ): Promise<IEmployeeActivity[]> {
    // Verify employee exists
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    return await EmployeeActivityRepository.getEmployeeTimeline(employeeId, limit);
  }

  /**
   * List activities with pagination and filters
   */
  async listActivities(
    query: EmployeeActivityQueryDTO = {},
    pagination?: PaginationDTO
  ): Promise<any> {
    const { activities, total } = await EmployeeActivityRepository.findWithPagination(
      query,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(activities, total, page, limit);
  }

  /**
   * Get activities by employee
   */
  async getActivitiesByEmployee(
    employeeId: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    // Verify employee exists
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const { activities, total } = await EmployeeActivityRepository.findByEmployeeId(
      employeeId,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(activities, total, page, limit);
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(
    activityType: ActivityType,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { activities, total } = await EmployeeActivityRepository.findByActivityType(
      activityType,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(activities, total, page, limit);
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 100): Promise<IEmployeeActivity[]> {
    return await EmployeeActivityRepository.getRecentActivities(limit);
  }

  /**
   * Get activities by date range
   */
  async getActivitiesByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { activities, total } = await EmployeeActivityRepository.findByDateRange(
      startDate,
      endDate,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(activities, total, page, limit);
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<ActivityType, number>> {
    return await EmployeeActivityRepository.getActivityStats(startDate, endDate);
  }

  /**
   * Search activities
   */
  async searchActivities(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { activities, total } = await EmployeeActivityRepository.search(
      searchTerm,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(activities, total, page, limit);
  }

  /**
   * Get activity summary for dashboard
   */
  async getActivitySummary(): Promise<{
    totalActivities: number;
    activityTypes: Record<ActivityType, number>;
    recentActivities: IEmployeeActivity[];
  }> {
    const stats = await EmployeeActivityRepository.getActivityStats();
    const recent = await EmployeeActivityRepository.getRecentActivities(10);

    const totalActivities = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return {
      totalActivities,
      activityTypes: stats,
      recentActivities: recent,
    };
  }

  /**
   * Get employee activity count
   */
  async getEmployeeActivityCount(employeeId: string): Promise<number> {
    // Verify employee exists
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    return await EmployeeActivityRepository.countByEmployeeId(employeeId);
  }

  /**
   * Get activity type distribution
   */
  async getActivityTypeDistribution(): Promise<
    Array<{ type: ActivityType; count: number }>
  > {
    const stats = await EmployeeActivityRepository.getActivityStats();

    return Object.entries(stats)
      .map(([type, count]) => ({
        type: type as ActivityType,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }
}

export default new EmployeeActivityService();
