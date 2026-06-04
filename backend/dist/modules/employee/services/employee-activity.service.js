"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeActivityService = void 0;
const employee_activity_repository_1 = __importDefault(require("../repositories/employee-activity.repository"));
const employee_repository_1 = __importDefault(require("../repositories/employee.repository"));
const common_dto_1 = require("../dtos/common.dto");
class EmployeeActivityService {
    /**
     * Create a new activity record (internal use)
     */
    async createActivity(activityData) {
        // Verify employee exists
        const employee = await employee_repository_1.default.findById(activityData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return await employee_activity_repository_1.default.create(activityData);
    }
    /**
     * Get activity by ID
     */
    async getActivity(activityId) {
        const activity = await employee_activity_repository_1.default.findById(activityId);
        if (!activity) {
            throw new Error('Activity not found');
        }
        return activity;
    }
    /**
     * Get employee timeline/activities
     */
    async getEmployeeTimeline(employeeId, limit = 50) {
        // Verify employee exists
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return await employee_activity_repository_1.default.getEmployeeTimeline(employeeId, limit);
    }
    /**
     * List activities with pagination and filters
     */
    async listActivities(query = {}, pagination) {
        const { activities, total } = await employee_activity_repository_1.default.findWithPagination(query, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(activities, total, page, limit);
    }
    /**
     * Get activities by employee
     */
    async getActivitiesByEmployee(employeeId, pagination) {
        // Verify employee exists
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const { activities, total } = await employee_activity_repository_1.default.findByEmployeeId(employeeId, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(activities, total, page, limit);
    }
    /**
     * Get activities by type
     */
    async getActivitiesByType(activityType, pagination) {
        const { activities, total } = await employee_activity_repository_1.default.findByActivityType(activityType, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(activities, total, page, limit);
    }
    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 100) {
        return await employee_activity_repository_1.default.getRecentActivities(limit);
    }
    /**
     * Get activities by date range
     */
    async getActivitiesByDateRange(startDate, endDate, pagination) {
        const { activities, total } = await employee_activity_repository_1.default.findByDateRange(startDate, endDate, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(activities, total, page, limit);
    }
    /**
     * Get activity statistics
     */
    async getActivityStats(startDate, endDate) {
        return await employee_activity_repository_1.default.getActivityStats(startDate, endDate);
    }
    /**
     * Search activities
     */
    async searchActivities(searchTerm, pagination) {
        const { activities, total } = await employee_activity_repository_1.default.search(searchTerm, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(activities, total, page, limit);
    }
    /**
     * Get activity summary for dashboard
     */
    async getActivitySummary() {
        const stats = await employee_activity_repository_1.default.getActivityStats();
        const recent = await employee_activity_repository_1.default.getRecentActivities(10);
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
    async getEmployeeActivityCount(employeeId) {
        // Verify employee exists
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return await employee_activity_repository_1.default.countByEmployeeId(employeeId);
    }
    /**
     * Get activity type distribution
     */
    async getActivityTypeDistribution() {
        const stats = await employee_activity_repository_1.default.getActivityStats();
        return Object.entries(stats)
            .map(([type, count]) => ({
            type: type,
            count,
        }))
            .sort((a, b) => b.count - a.count);
    }
}
exports.EmployeeActivityService = EmployeeActivityService;
exports.default = new EmployeeActivityService();
