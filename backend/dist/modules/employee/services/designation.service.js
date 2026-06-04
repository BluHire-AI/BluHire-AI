"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationService = void 0;
const designation_repository_1 = __importDefault(require("../repositories/designation.repository"));
const department_repository_1 = __importDefault(require("../repositories/department.repository"));
const common_dto_1 = require("../dtos/common.dto");
class DesignationService {
    /**
     * Create a new designation
     */
    async createDesignation(designationData, userId) {
        // Verify department exists
        const department = await department_repository_1.default.findById(designationData.departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        // Check if designation title already exists in this department
        const titleExists = await designation_repository_1.default.titleExists(designationData.title, designationData.departmentId);
        if (titleExists) {
            throw new Error(`Designation "${designationData.title}" already exists in this department`);
        }
        // Validate level
        if (designationData.level < 1 || designationData.level > 7) {
            throw new Error('Designation level must be between 1 and 7');
        }
        // Create designation
        return await designation_repository_1.default.create({
            title: designationData.title,
            description: designationData.description,
            departmentId: designationData.departmentId,
            level: designationData.level,
        });
    }
    /**
     * Get designation by ID
     */
    async getDesignation(designationId) {
        const designation = await designation_repository_1.default.findById(designationId);
        if (!designation) {
            throw new Error('Designation not found');
        }
        return designation;
    }
    /**
     * Update designation
     */
    async updateDesignation(designationId, updateData, userId) {
        const designation = await designation_repository_1.default.findById(designationId);
        if (!designation) {
            throw new Error('Designation not found');
        }
        // Verify new department if provided
        if (updateData.departmentId) {
            const department = await department_repository_1.default.findById(updateData.departmentId);
            if (!department) {
                throw new Error('Department not found');
            }
        }
        // Check if new title already exists
        if (updateData.title) {
            const titleExists = await designation_repository_1.default.titleExists(updateData.title, updateData.departmentId || designation.departmentId.toString(), designationId);
            if (titleExists) {
                throw new Error(`Designation "${updateData.title}" already exists in this department`);
            }
        }
        // Validate level if provided
        if (updateData.level && (updateData.level < 1 || updateData.level > 7)) {
            throw new Error('Designation level must be between 1 and 7');
        }
        // Update designation
        const updated = await designation_repository_1.default.update(designationId, updateData);
        if (!updated) {
            throw new Error('Failed to update designation');
        }
        return updated;
    }
    /**
     * Delete designation
     */
    async deleteDesignation(designationId) {
        const designation = await designation_repository_1.default.findById(designationId);
        if (!designation) {
            throw new Error('Designation not found');
        }
        // Note: You may want to add additional checks here to prevent deletion
        // if employees are assigned to this designation
        await designation_repository_1.default.delete(designationId);
    }
    /**
     * List designations with pagination
     */
    async listDesignations(query = {}, pagination) {
        const { designations, total } = await designation_repository_1.default.findWithPagination(query, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(designations, total, page, limit);
    }
    /**
     * Get designations by department
     */
    async getDesignationsByDepartment(departmentId, pagination) {
        const { designations, total } = await designation_repository_1.default.findByDepartment(departmentId, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(designations, total, page, limit);
    }
    /**
     * Get designations by level
     */
    async getDesignationsByLevel(level, pagination) {
        const { designations, total } = await designation_repository_1.default.findByLevel(level, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(designations, total, page, limit);
    }
    /**
     * Get all designations
     */
    async getAllDesignations() {
        return await designation_repository_1.default.findAll();
    }
    /**
     * Get designations by level range
     */
    async getDesignationsByLevelRange(minLevel, maxLevel) {
        return await designation_repository_1.default.findByLevelRange(minLevel, maxLevel);
    }
    /**
     * Get all available levels
     */
    async getAllLevels() {
        const levels = await designation_repository_1.default.getAllLevels();
        const result = [];
        for (const level of levels) {
            const count = await designation_repository_1.default.findByLevel(level).then((r) => r.designations.length);
            result.push({
                level,
                name: this.getLevelName(level),
                count,
            });
        }
        return result;
    }
    /**
     * Get designation statistics
     */
    async getDesignationStats() {
        const total = await designation_repository_1.default.countAll();
        const levels = await designation_repository_1.default.getAllLevels();
        const byLevel = {};
        for (const level of levels) {
            const count = await designation_repository_1.default.findByLevel(level).then((r) => r.designations.length);
            byLevel[level] = count;
        }
        return {
            totalDesignations: total,
            byLevel,
        };
    }
    /**
     * Search designations
     */
    async searchDesignations(searchTerm, pagination) {
        const { designations, total } = await designation_repository_1.default.search(searchTerm, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(designations, total, page, limit);
    }
    /**
     * Get level name
     */
    getLevelName(level) {
        const names = {
            1: 'Entry Level',
            2: 'Mid Level',
            3: 'Senior',
            4: 'Lead',
            5: 'Manager',
            6: 'Director',
            7: 'Executive',
        };
        return names[level] || 'Unknown';
    }
}
exports.DesignationService = DesignationService;
exports.default = new DesignationService();
