"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeActivityRepository = void 0;
const EmployeeActivity_1 = __importDefault(require("../../../models/EmployeeActivity"));
class EmployeeActivityRepository {
    /**
     * Create a new activity
     */
    async create(activityData) {
        const activity = new EmployeeActivity_1.default(activityData);
        return await activity.save();
    }
    /**
     * Get activity by ID
     */
    async findById(activityId) {
        return await EmployeeActivity_1.default.findById(activityId)
            .populate('employeeId', 'firstName lastName employeeCode email')
            .populate('createdBy', 'firstName lastName email');
    }
    /**
     * Get employee activities with pagination
     */
    async findWithPagination(query = {}, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = {};
        // Apply filters
        if (query.employeeId)
            filter.employeeId = query.employeeId;
        if (query.activityType)
            filter.activityType = query.activityType;
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
        const sort = { [sortBy]: sortOrder };
        const [activities, total] = await Promise.all([
            EmployeeActivity_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('employeeId', 'firstName lastName employeeCode email')
                .populate('createdBy', 'firstName lastName email'),
            EmployeeActivity_1.default.countDocuments(filter),
        ]);
        return { activities, total };
    }
    /**
     * Get activities for a specific employee
     */
    async findByEmployeeId(employeeId, pagination) {
        return this.findWithPagination({ employeeId }, pagination);
    }
    /**
     * Get activities by type
     */
    async findByActivityType(activityType, pagination) {
        return this.findWithPagination({ activityType }, pagination);
    }
    /**
     * Get employee timeline
     */
    async getEmployeeTimeline(employeeId, limit = 50) {
        return await EmployeeActivity_1.default.find({ employeeId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('employeeId', 'firstName lastName employeeCode email')
            .populate('createdBy', 'firstName lastName email');
    }
    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 100, dayLimit = 30) {
        const date = new Date();
        date.setDate(date.getDate() - dayLimit);
        return await EmployeeActivity_1.default.find({
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
    async findByEmployeeIds(employeeIds, pagination) {
        const page = Math.max(1, pagination?.page || 1);
        const limit = Math.min(100, pagination?.limit || 10);
        const skip = (page - 1) * limit;
        const filter = { employeeId: { $in: employeeIds } };
        const [activities, total] = await Promise.all([
            EmployeeActivity_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('employeeId', 'firstName lastName employeeCode email')
                .populate('createdBy', 'firstName lastName email'),
            EmployeeActivity_1.default.countDocuments(filter),
        ]);
        return { activities, total };
    }
    /**
     * Get activities by date range
     */
    async findByDateRange(startDate, endDate, pagination) {
        return this.findWithPagination({ startDate, endDate }, pagination);
    }
    /**
     * Count activities for employee
     */
    async countByEmployeeId(employeeId) {
        return await EmployeeActivity_1.default.countDocuments({ employeeId });
    }
    /**
     * Count activities by type
     */
    async countByActivityType(activityType) {
        return await EmployeeActivity_1.default.countDocuments({ activityType });
    }
    /**
     * Get activity statistics
     */
    async getActivityStats(startDate, endDate) {
        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate)
                filter.createdAt.$gte = startDate;
            if (endDate)
                filter.createdAt.$lte = endDate;
        }
        const stats = await EmployeeActivity_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$activityType',
                    count: { $sum: 1 },
                },
            },
        ]);
        const result = {};
        stats.forEach((stat) => {
            result[stat._id] = stat.count;
        });
        return result;
    }
    /**
     * Delete activities older than specified days
     */
    async deleteOldActivities(daysOld) {
        const date = new Date();
        date.setDate(date.getDate() - daysOld);
        const result = await EmployeeActivity_1.default.deleteMany({
            createdAt: { $lt: date },
        });
        return { deletedCount: result.deletedCount };
    }
    /**
     * Get all activity types used
     */
    async getAllActivityTypes() {
        const types = await EmployeeActivity_1.default.distinct('activityType');
        return types;
    }
    /**
     * Search activities
     */
    async search(searchTerm, pagination) {
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
            EmployeeActivity_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('employeeId', 'firstName lastName employeeCode email')
                .populate('createdBy', 'firstName lastName email'),
            EmployeeActivity_1.default.countDocuments(filter),
        ]);
        return { activities, total };
    }
}
exports.EmployeeActivityRepository = EmployeeActivityRepository;
exports.default = new EmployeeActivityRepository();
