"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationRepository = void 0;
const Designation_1 = __importDefault(require("../../../models/Designation"));
class DesignationRepository {
    /**
     * Create a new designation
     */
    async create(designationData) {
        const designation = new Designation_1.default(designationData);
        return await designation.save();
    }
    /**
     * Get designation by ID
     */
    async findById(designationId) {
        return await Designation_1.default.findById(designationId)
            .populate('departmentId', 'name');
    }
    /**
     * Get designation by title
     */
    async findByTitle(title, departmentId) {
        const filter = { title: { $regex: title, $options: 'i' } };
        if (departmentId)
            filter.departmentId = departmentId;
        return await Designation_1.default.findOne(filter)
            .populate('departmentId', 'name');
    }
    /**
     * Update designation
     */
    async update(designationId, updateData) {
        return await Designation_1.default.findByIdAndUpdate(designationId, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true })
            .populate('departmentId', 'name');
    }
    /**
     * Delete designation
     */
    async delete(designationId) {
        await Designation_1.default.findByIdAndDelete(designationId);
    }
    /**
     * List designations with pagination
     */
    async findWithPagination(query = {}, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = {};
        // Apply filters
        if (query.departmentId)
            filter.departmentId = query.departmentId;
        if (query.level !== undefined)
            filter.level = query.level;
        // Apply search
        if (query.search) {
            filter.$or = [
                { title: new RegExp(query.search, 'i') },
                { description: new RegExp(query.search, 'i') },
            ];
        }
        // Determine sort
        const sortBy = query.sortBy || 'title';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        const [designations, total] = await Promise.all([
            Designation_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('departmentId', 'name'),
            Designation_1.default.countDocuments(filter),
        ]);
        return { designations, total };
    }
    /**
     * Get designations by department
     */
    async findByDepartment(departmentId, pagination) {
        return this.findWithPagination({ departmentId }, pagination);
    }
    /**
     * Get designations by level
     */
    async findByLevel(level, pagination) {
        return this.findWithPagination({ level }, pagination);
    }
    /**
     * Get all designations
     */
    async findAll() {
        return await Designation_1.default.find()
            .sort({ title: 1 })
            .populate('departmentId', 'name');
    }
    /**
     * Check if designation title exists
     */
    async titleExists(title, departmentId, excludeDesignationId) {
        const filter = {
            title: { $regex: `^${title}$`, $options: 'i' },
            departmentId,
        };
        if (excludeDesignationId) {
            filter._id = { $ne: excludeDesignationId };
        }
        const count = await Designation_1.default.countDocuments(filter);
        return count > 0;
    }
    /**
     * Count total designations
     */
    async countAll() {
        return await Designation_1.default.countDocuments();
    }
    /**
     * Count designations by department
     */
    async countByDepartment(departmentId) {
        return await Designation_1.default.countDocuments({ departmentId });
    }
    /**
     * Get designations by level range
     */
    async findByLevelRange(minLevel, maxLevel) {
        return await Designation_1.default.find({
            level: { $gte: minLevel, $lte: maxLevel },
        })
            .sort({ level: 1, title: 1 })
            .populate('departmentId', 'name');
    }
    /**
     * Get all available levels
     */
    async getAllLevels() {
        const levels = await Designation_1.default.distinct('level');
        return levels.sort((a, b) => a - b);
    }
    /**
     * Bulk update designations
     */
    async bulkUpdate(designationIds, updateData) {
        const result = await Designation_1.default.updateMany({ _id: { $in: designationIds } }, { ...updateData, updatedAt: new Date() }, { runValidators: true });
        return { modifiedCount: result.modifiedCount };
    }
    /**
     * Search designations
     */
    async search(searchTerm, pagination) {
        return this.findWithPagination({ search: searchTerm }, pagination);
    }
}
exports.DesignationRepository = DesignationRepository;
exports.default = new DesignationRepository();
