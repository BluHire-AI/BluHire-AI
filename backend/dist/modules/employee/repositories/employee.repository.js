"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRepository = void 0;
const Employee_1 = __importStar(require("../../../models/Employee"));
class EmployeeRepository {
    /**
     * Create a new employee
     */
    async create(employeeData) {
        const employee = new Employee_1.default(employeeData);
        return await employee.save();
    }
    /**
     * Get employee by ID
     */
    async findById(employeeId) {
        return await Employee_1.default.findOne({
            _id: employeeId,
            isDeleted: false,
        })
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
    }
    /**
     * Get employee by employee code
     */
    async findByCode(employeeCode) {
        return await Employee_1.default.findOne({
            employeeCode: employeeCode.toUpperCase(),
            isDeleted: false,
        })
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
    }
    /**
     * Get employee by user ID
     */
    async findByUserId(userId) {
        return await Employee_1.default.findOne({
            userId,
            isDeleted: false,
        })
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
    }
    /**
     * Update employee
     */
    async update(employeeId, updateData) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true })
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
    }
    /**
     * Soft delete employee
     */
    async softDelete(employeeId) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, { isDeleted: true, updatedAt: new Date() }, { new: true });
    }
    /**
     * Hard delete employee (only for testing/admin)
     */
    async hardDelete(employeeId) {
        await Employee_1.default.findByIdAndDelete(employeeId);
    }
    /**
     * List employees with pagination and filters
     */
    async findWithPagination(query, pagination = { page: 1, limit: 10 }) {
        const page = Math.max(1, pagination.page || 1);
        const limit = Math.min(100, pagination.limit || 10);
        const skip = (page - 1) * limit;
        const filter = { isDeleted: false };
        // Apply filters
        if (query.departmentId)
            filter.departmentId = query.departmentId;
        if (query.designationId)
            filter.designationId = query.designationId;
        if (query.managerId)
            filter.managerId = query.managerId;
        if (query.employmentStatus)
            filter.employmentStatus = query.employmentStatus;
        if (query.employmentType)
            filter.employmentType = query.employmentType;
        if (query.workLocation)
            filter.workLocation = query.workLocation;
        // Apply search
        if (query.search) {
            filter.$or = [
                { employeeCode: new RegExp(query.search, 'i') },
                { firstName: new RegExp(query.search, 'i') },
                { lastName: new RegExp(query.search, 'i') },
                { email: new RegExp(query.search, 'i') },
                { phone: new RegExp(query.search, 'i') },
            ];
        }
        // Determine sort
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        const [employees, total] = await Promise.all([
            Employee_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'firstName lastName email role')
                .populate('departmentId', 'name')
                .populate('designationId', 'title level')
                .populate('managerId', 'firstName lastName email employeeCode'),
            Employee_1.default.countDocuments(filter),
        ]);
        return { employees, total };
    }
    /**
     * Get employees by department
     */
    async findByDepartment(departmentId, pagination) {
        return this.findWithPagination({ departmentId }, pagination);
    }
    /**
     * Get employees by manager (team members)
     */
    async findByManager(managerId, pagination) {
        return this.findWithPagination({ managerId }, pagination);
    }
    /**
     * Get employees by status
     */
    async findByStatus(status, pagination) {
        return this.findWithPagination({ employmentStatus: status }, pagination);
    }
    /**
     * Get employees by employment type
     */
    async findByEmploymentType(type, pagination) {
        return this.findWithPagination({ employmentType: type }, pagination);
    }
    /**
     * Search employees
     */
    async search(searchTerm, pagination) {
        return this.findWithPagination({ search: searchTerm }, pagination);
    }
    /**
     * Get all managers (employees who manage others)
     */
    async getAllManagers() {
        return await Employee_1.default.find({
            isDeleted: false,
            _id: { $in: (await Employee_1.default.distinct('managerId', { isDeleted: false, managerId: { $ne: null } })) },
        })
            .select('_id firstName lastName email employeeCode designationId departmentId')
            .populate('departmentId', 'name')
            .populate('designationId', 'title');
    }
    /**
     * Get employee count by status
     */
    async countByStatus(status) {
        return await Employee_1.default.countDocuments({
            employmentStatus: status,
            isDeleted: false,
        });
    }
    /**
     * Get employee count by department
     */
    async countByDepartment(departmentId) {
        return await Employee_1.default.countDocuments({
            departmentId,
            isDeleted: false,
        });
    }
    /**
     * Get employee count by designation
     */
    async countByDesignation(designationId) {
        return await Employee_1.default.countDocuments({
            designationId,
            isDeleted: false,
        });
    }
    /**
     * Check if employee code exists
     */
    async codeExists(employeeCode) {
        const count = await Employee_1.default.countDocuments({
            employeeCode: employeeCode.toUpperCase(),
            isDeleted: false,
        });
        return count > 0;
    }
    /**
     * Check if user ID already has an employee record
     */
    async userIdExists(userId) {
        const count = await Employee_1.default.countDocuments({
            userId,
            isDeleted: false,
        });
        return count > 0;
    }
    /**
     * Get total active employees
     */
    async countActiveEmployees() {
        return await Employee_1.default.countDocuments({
            employmentStatus: Employee_1.EmploymentStatus.ACTIVE,
            isDeleted: false,
        });
    }
    /**
     * Get employees by multiple criteria
     */
    async findByMultipleCriteria(criteria) {
        const filter = { isDeleted: false };
        if (criteria.departmentIds?.length) {
            filter.departmentId = { $in: criteria.departmentIds };
        }
        if (criteria.designationIds?.length) {
            filter.designationId = { $in: criteria.designationIds };
        }
        if (criteria.statuses?.length) {
            filter.employmentStatus = { $in: criteria.statuses };
        }
        if (criteria.types?.length) {
            filter.employmentType = { $in: criteria.types };
        }
        return await Employee_1.default.find(filter)
            .populate('userId', 'firstName lastName email role')
            .populate('departmentId', 'name')
            .populate('designationId', 'title level')
            .populate('managerId', 'firstName lastName email employeeCode');
    }
    /**
     * Get employee reports (direct reports of manager)
     */
    async getDirectReports(managerId, includeInactive = false) {
        const filter = {
            managerId,
            isDeleted: false,
        };
        if (!includeInactive) {
            filter.employmentStatus = Employee_1.EmploymentStatus.ACTIVE;
        }
        return await Employee_1.default.find(filter)
            .select('_id firstName lastName email employeeCode designationId departmentId profileImage')
            .populate('departmentId', 'name')
            .populate('designationId', 'title');
    }
    /**
     * Bulk update employees
     */
    async bulkUpdate(employeeIds, updateData) {
        const result = await Employee_1.default.updateMany({ _id: { $in: employeeIds }, isDeleted: false }, { ...updateData, updatedAt: new Date() }, { runValidators: true });
        return { modifiedCount: result.modifiedCount };
    }
    /**
     * Add skill to employee
     */
    async addSkill(employeeId, skill) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $addToSet: { skills: skill },
            updatedAt: new Date(),
        }, { new: true });
    }
    /**
     * Remove skill from employee
     */
    async removeSkill(employeeId, skill) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $pull: { skills: skill },
            updatedAt: new Date(),
        }, { new: true });
    }
    /**
     * Add education to employee
     */
    async addEducation(employeeId, education) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $push: { education },
            updatedAt: new Date(),
        }, { new: true });
    }
    /**
     * Add certification to employee
     */
    async addCertification(employeeId, certification) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $push: { certifications: certification },
            updatedAt: new Date(),
        }, { new: true });
    }
    /**
     * Add document to employee
     */
    async addDocument(employeeId, document) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $push: { documents: document },
            updatedAt: new Date(),
        }, { new: true });
    }
    /**
     * Remove document from employee
     */
    async removeDocument(employeeId, documentFileName) {
        return await Employee_1.default.findByIdAndUpdate(employeeId, {
            $pull: { documents: { fileName: documentFileName } },
            updatedAt: new Date(),
        }, { new: true });
    }
}
exports.EmployeeRepository = EmployeeRepository;
exports.default = new EmployeeRepository();
