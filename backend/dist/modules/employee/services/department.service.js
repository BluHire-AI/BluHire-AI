"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const department_repository_1 = __importDefault(require("../repositories/department.repository"));
const employee_repository_1 = __importDefault(require("../repositories/employee.repository"));
const common_dto_1 = require("../dtos/common.dto");
class DepartmentService {
    /**
     * Create a new department
     */
    async createDepartment(departmentData, userId) {
        // Check if department name already exists
        const nameExists = await department_repository_1.default.nameExists(departmentData.name);
        if (nameExists) {
            throw new Error(`Department with name "${departmentData.name}" already exists`);
        }
        // Verify department head exists if provided
        if (departmentData.departmentHead) {
            const head = await employee_repository_1.default.findById(departmentData.departmentHead);
            if (!head) {
                throw new Error('Department head not found');
            }
        }
        // Create department
        return await department_repository_1.default.create({
            name: departmentData.name,
            description: departmentData.description,
            departmentHead: departmentData.departmentHead || undefined,
            isActive: true,
        });
    }
    /**
     * Get department by ID
     */
    async getDepartment(departmentId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        return department;
    }
    /**
     * Update department
     */
    async updateDepartment(departmentId, updateData, userId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        // Check if new name already exists
        if (updateData.name) {
            const nameExists = await department_repository_1.default.nameExists(updateData.name, departmentId);
            if (nameExists) {
                throw new Error(`Department with name "${updateData.name}" already exists`);
            }
        }
        // Verify new department head exists if provided
        if (updateData.departmentHead) {
            const head = await employee_repository_1.default.findById(updateData.departmentHead);
            if (!head) {
                throw new Error('Department head not found');
            }
        }
        // Update department
        const updated = await department_repository_1.default.update(departmentId, updateData);
        if (!updated) {
            throw new Error('Failed to update department');
        }
        return updated;
    }
    /**
     * Delete department
     */
    async deleteDepartment(departmentId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        // Check if department has employees
        const employeeCount = await employee_repository_1.default.countByDepartment(departmentId);
        if (employeeCount > 0) {
            throw new Error('Cannot delete department with active employees');
        }
        await department_repository_1.default.delete(departmentId);
    }
    /**
     * List departments with pagination
     */
    async listDepartments(query = {}, pagination) {
        const { departments, total } = await department_repository_1.default.findWithPagination(query, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(departments, total, page, limit);
    }
    /**
     * Get all active departments
     */
    async getAllActiveDepartments() {
        return await department_repository_1.default.findAllActive();
    }
    /**
     * Get all departments
     */
    async getAllDepartments() {
        return await department_repository_1.default.findAll();
    }
    /**
     * Assign or reassign department head
     */
    async assignDepartmentHead(assignData, userId) {
        // Verify department exists
        const department = await department_repository_1.default.findById(assignData.departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        // Verify employee exists
        const employee = await employee_repository_1.default.findById(assignData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Verify employee belongs to the department
        if (employee.departmentId.toString() !== assignData.departmentId) {
            throw new Error('Employee must belong to the department to be assigned as head');
        }
        const updated = await department_repository_1.default.assignHead(assignData.departmentId, assignData.employeeId);
        if (!updated) {
            throw new Error('Failed to assign department head');
        }
        return updated;
    }
    /**
     * Remove department head
     */
    async removeDepartmentHead(departmentId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        const updated = await department_repository_1.default.removeHead(departmentId);
        if (!updated) {
            throw new Error('Failed to remove department head');
        }
        return updated;
    }
    /**
     * Toggle department status
     */
    async toggleDepartmentStatus(departmentId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        const updated = await department_repository_1.default.toggleStatus(departmentId);
        if (!updated) {
            throw new Error('Failed to toggle department status');
        }
        return updated;
    }
    /**
     * Get department statistics
     */
    async getDepartmentStats() {
        const [total, active] = await Promise.all([
            department_repository_1.default.countAll(),
            department_repository_1.default.countActive(),
        ]);
        const departments = await department_repository_1.default.findAll();
        const departmentsWithHeads = departments.filter((d) => d.departmentHead).length;
        return {
            totalDepartments: total,
            activeDepartments: active,
            departmentsWithHeads,
        };
    }
    /**
     * Get department with employee count
     */
    async getDepartmentWithDetails(departmentId) {
        const department = await department_repository_1.default.findById(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        const employeeCount = await employee_repository_1.default.countByDepartment(departmentId);
        return {
            ...department.toObject(),
            employeeCount,
        };
    }
    /**
     * Search departments
     */
    async searchDepartments(searchTerm, pagination) {
        const { departments, total } = await department_repository_1.default.findWithPagination({ search: searchTerm }, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(departments, total, page, limit);
    }
}
exports.DepartmentService = DepartmentService;
exports.default = new DepartmentService();
