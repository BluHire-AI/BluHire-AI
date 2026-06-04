import EmployeeActivityModel, {
  IEmployeeActivity,
  ActivityType,
} from '../../../models/EmployeeActivity';
import { PaginationDTO } from '../dtos/common.dto';
import { EmployeeActivityQueryDTO } from '../dtos/employee-activity.dto';

export class EmployeeActivityRepository {
  /**
   * Create a new activity
   */
  async create(
    activityData: Partial<IEmployeeActivity>
  ): Promise<IEmployeeActivity> {
    const activity = new EmployeeActivityModel(activityData);
    return await activity.save();
  }

  /**
   * Get activity by ID
   */
  async findById(activityId: string): Promise<IEmployeeActivity | null> {
    return await EmployeeActivityModel.findById(activityId)
      .populate('employeeId', 'firstName lastName employeeCode email')
      .populate('createdBy', 'firstName lastName email');
  }

  /**
   * Get employee activities with pagination
   */
  async findWithPagination(
    query: EmployeeActivityQueryDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.activityType) filter.activityType = query.activityType;

    // Apply date range filters
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate)
        filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate)
        filter.createdAt.$lte = new Date(query.endDate);
    }

    // Determine sort
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [activities, total] = await Promise.all([
      EmployeeActivityModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'firstName lastName employeeCode email')
        .populate('createdBy', 'firstName lastName email'),
      EmployeeActivityModel.countDocuments(filter),
    ]);

    return { activities, total };
  }

  /**
   * Get activities for a specific employee
   */
  async findByEmployeeId(
    employeeId: string,
    pagination?: PaginationDTO
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    return this.findWithPagination(
      { employeeId },
      pagination
    );
  }

  /**
   * Get activities by type
   */
  async findByActivityType(
    activityType: ActivityType,
    pagination?: PaginationDTO
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    return this.findWithPagination(
      { activityType },
      pagination
    );
  }

  /**
   * Get employee timeline
   */
  async getEmployeeTimeline(
    employeeId: string,
    limit: number = 50
  ): Promise<IEmployeeActivity[]> {
    return await EmployeeActivityModel.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('employeeId', 'firstName lastName employeeCode email')
      .populate('createdBy', 'firstName lastName email');
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(
    limit: number = 100,
    dayLimit: number = 30
  ): Promise<IEmployeeActivity[]> {
    const date = new Date();
    date.setDate(date.getDate() - dayLimit);

    return await EmployeeActivityModel.find({
      createdAt: { $gte: date },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('employeeId', 'firstName lastName employeeCode email')
      .populate('createdBy', 'firstName lastName email');
  }

  /**
   * Get activities for multiple employees
   */
  async findByEmployeeIds(
    employeeIds: string[],
    pagination?: PaginationDTO
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(100, pagination?.limit || 10);
    const skip = (page - 1) * limit;

    const filter = { employeeId: { $in: employeeIds } };

    const [activities, total] = await Promise.all([
      EmployeeActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'firstName lastName employeeCode email')
        .populate('createdBy', 'firstName lastName email'),
      EmployeeActivityModel.countDocuments(filter),
    ]);

    return { activities, total };
  }

  /**
   * Get activities by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationDTO
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    return this.findWithPagination(
      { startDate, endDate },
      pagination
    );
  }

  /**
   * Count activities for employee
   */
  async countByEmployeeId(employeeId: string): Promise<number> {
    return await EmployeeActivityModel.countDocuments({ employeeId });
  }

  /**
   * Count activities by type
   */
  async countByActivityType(activityType: ActivityType): Promise<number> {
    return await EmployeeActivityModel.countDocuments({ activityType });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<ActivityType, number>> {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const stats = await EmployeeActivityModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {};
    stats.forEach((stat: any) => {
      result[stat._id] = stat.count;
    });

    return result as Record<ActivityType, number>;
  }

  /**
   * Delete activities older than specified days
   */
  async deleteOldActivities(daysOld: number): Promise<{ deletedCount: number }> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await EmployeeActivityModel.deleteMany({
      createdAt: { $lt: date },
    });

    return { deletedCount: result.deletedCount };
  }

  /**
   * Get all activity types used
   */
  async getAllActivityTypes(): Promise<ActivityType[]> {
    const types = await EmployeeActivityModel.distinct('activityType');
    return types;
  }

  /**
   * Search activities
   */
  async search(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<{ activities: IEmployeeActivity[]; total: number }> {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(100, pagination?.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { title: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') },
      ],
    };

    const [activities, total] = await Promise.all([
      EmployeeActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'firstName lastName employeeCode email')
        .populate('createdBy', 'firstName lastName email'),
      EmployeeActivityModel.countDocuments(filter),
    ]);

    return { activities, total };
  }
}

export default new EmployeeActivityRepository();
