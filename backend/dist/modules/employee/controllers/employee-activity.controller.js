"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeActivityController = void 0;
const employee_activity_service_1 = __importDefault(require("../services/employee-activity.service"));
const common_dto_1 = require("../dtos/common.dto");
class EmployeeActivityController {
    /**
     * Get activity by ID
     * GET /api/v1/activities/:id
     */
    async getActivity(req, res) {
        try {
            const { id } = req.params;
            const activity = await employee_activity_service_1.default.getActivity(id);
            res.json((0, common_dto_1.createSuccessResponse)(activity, 'Activity retrieved successfully'));
        }
        catch (error) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(error.message || 'Activity not found', undefined, 404));
        }
    }
    /**
     * List activities
     * GET /api/v1/activities
     */
    async listActivities(req, res) {
        try {
            const query = req.query;
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const result = await employee_activity_service_1.default.listActivities(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list activities', undefined, 400));
        }
    }
    /**
     * Get employee timeline
     * GET /api/v1/activities/employee/:employeeId/timeline
     */
    async getEmployeeTimeline(req, res) {
        try {
            const { employeeId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const timeline = await employee_activity_service_1.default.getEmployeeTimeline(employeeId, limit);
            res.json((0, common_dto_1.createSuccessResponse)(timeline, 'Employee timeline retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve timeline', undefined, 400));
        }
    }
    /**
     * Get activities by employee
     * GET /api/v1/activities/employee/:employeeId
     */
    async getByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_activity_service_1.default.getActivitiesByEmployee(employeeId, {
                page,
                limit,
            });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve activities', undefined, 400));
        }
    }
    /**
     * Get activities by type
     * GET /api/v1/activities/type/:activityType
     */
    async getByType(req, res) {
        try {
            const { activityType } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_activity_service_1.default.getActivitiesByType(activityType, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve activities', undefined, 400));
        }
    }
    /**
     * Get recent activities
     * GET /api/v1/activities/recent
     */
    async getRecent(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const activities = await employee_activity_service_1.default.getRecentActivities(limit);
            res.json((0, common_dto_1.createSuccessResponse)(activities, 'Recent activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve activities', undefined, 400));
        }
    }
    /**
     * Get activities by date range
     * GET /api/v1/activities/date-range
     */
    async getByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            if (!startDate || !endDate) {
                res.status(400).json((0, common_dto_1.createErrorResponse)('startDate and endDate query parameters are required', undefined, 400));
                return;
            }
            const result = await employee_activity_service_1.default.getActivitiesByDateRange(new Date(startDate), new Date(endDate), { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Activities retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve activities', undefined, 400));
        }
    }
    /**
     * Get activity statistics
     * GET /api/v1/activities/stats/dashboard
     */
    async getStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const stats = await employee_activity_service_1.default.getActivityStats(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json((0, common_dto_1.createSuccessResponse)(stats, 'Activity statistics retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve statistics', undefined, 400));
        }
    }
    /**
     * Get activity summary
     * GET /api/v1/activities/summary/dashboard
     */
    async getSummary(req, res) {
        try {
            const summary = await employee_activity_service_1.default.getActivitySummary();
            res.json((0, common_dto_1.createSuccessResponse)(summary, 'Activity summary retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve summary', undefined, 400));
        }
    }
    /**
     * Get activity type distribution
     * GET /api/v1/activities/distribution
     */
    async getDistribution(req, res) {
        try {
            const distribution = await employee_activity_service_1.default.getActivityTypeDistribution();
            res.json((0, common_dto_1.createSuccessResponse)(distribution, 'Activity distribution retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve distribution', undefined, 400));
        }
    }
    /**
     * Search activities
     * GET /api/v1/activities/search/:query
     */
    async searchActivities(req, res) {
        try {
            const { query } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await employee_activity_service_1.default.searchActivities(query, { page, limit });
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Search results retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Search failed', undefined, 400));
        }
    }
    /**
     * Get employee activity count
     * GET /api/v1/activities/employee/:employeeId/count
     */
    async getEmployeeActivityCount(req, res) {
        try {
            const { employeeId } = req.params;
            const count = await employee_activity_service_1.default.getEmployeeActivityCount(employeeId);
            res.json((0, common_dto_1.createSuccessResponse)({ count }, 'Activity count retrieved successfully'));
        }
        catch (error) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve count', undefined, 400));
        }
    }
}
exports.EmployeeActivityController = EmployeeActivityController;
exports.default = new EmployeeActivityController();
