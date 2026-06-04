"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentRepository = void 0;
const Department_1 = __importDefault(require("../../../models/Department"));
class DepartmentRepository {
    /**
     * Create a new department
     */
    async create(departmentData) {
        const department = new Department_1.default(departmentData);
        return await department.save();
    }
    /**
     * Get department by ID
     */
    async findById(departmentId) {
        return await Department_1.default.findById(departmentId)
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Get department by name
     */
    async findByName(name) {
        return await Department_1.default.findOne({ name: { $regex: name, $options: 'i' } })
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Update department
     */
    async update(departmentId, updateData) {
        return await Department_1.default.findByIdAndUpdate(departmentId, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true })
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Delete department
     */
    async delete(departmentId) {
        await Department_1.default.findByIdAndDelete(departmentId);
    }
    /**
     * List departments with pagination
     */
    async findWithPagination(query = {}, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = {};
        // Apply filters
        if (query.isActive !== undefined)
            filter.isActive = query.isActive;
        // Apply search
        if (query.search) {
            filter.$or = [
                { name: new RegExp(query.search, 'i') },
                { description: new RegExp(query.search, 'i') },
            ];
        }
        // Determine sort
        const sortBy = query.sortBy || 'name';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        const [departments, total] = await Promise.all([
            Department_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('departmentHead', 'firstName lastName email employeeCode'),
            Department_1.default.countDocuments(filter),
        ]);
        return { departments, total };
    }
    /**
     * Get all active departments
     */
    async findAllActive() {
        return await Department_1.default.find({ isActive: true })
            .sort({ name: 1 })
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Get all departments
     */
    async findAll() {
        return await Department_1.default.find()
            .sort({ name: 1 })
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Check if department name exists
     */
    async nameExists(name, excludeDepartmentId) {
        const filter = { name: { $regex: `^${name}$`, $options: 'i' } };
        if (excludeDepartmentId) {
            filter._id = { $ne: excludeDepartmentId };
        }
        const count = await Department_1.default.countDocuments(filter);
        return count > 0;
    }
    /**
     * Count total departments
     */
    async countAll() {
        return await Department_1.default.countDocuments();
    }
    /**
     * Count active departments
     */
    async countActive() {
        return await Department_1.default.countDocuments({ isActive: true });
    }
    /**
     * Toggle department status
     */
    async toggleStatus(departmentId) {
        const department = await Department_1.default.findById(departmentId);
        if (!department)
            return null;
        return await Department_1.default.findByIdAndUpdate(departmentId, { isActive: !department.isActive, updatedAt: new Date() }, { new: true });
    }
    /**
     * Assign department head
     */
    async assignHead(departmentId, employeeId) {
        return await Department_1.default.findByIdAndUpdate(departmentId, { departmentHead: employeeId, updatedAt: new Date() }, { new: true })
            .populate('departmentHead', 'firstName lastName email employeeCode');
    }
    /**
     * Remove department head
     */
    async removeHead(departmentId) {
        return await Department_1.default.findByIdAndUpdate(departmentId, { departmentHead: null, updatedAt: new Date() }, { new: true });
    }
    /**
     * Bulk update departments
     */
    async bulkUpdate(departmentIds, updateData) {
        const result = await Department_1.default.updateMany({ _id: { $in: departmentIds } }, { ...updateData, updatedAt: new Date() }, { runValidators: true });
        return { modifiedCount: result.modifiedCount };
    }
}
exports.DepartmentRepository = DepartmentRepository;
exports.default = new DepartmentRepository();
