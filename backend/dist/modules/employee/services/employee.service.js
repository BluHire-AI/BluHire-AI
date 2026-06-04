"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const Employee_1 = require("../../../models/Employee");
const employee_repository_1 = __importDefault(require("../repositories/employee.repository"));
const employee_activity_repository_1 = __importDefault(require("../repositories/employee-activity.repository"));
const department_repository_1 = __importDefault(require("../repositories/department.repository"));
const designation_repository_1 = __importDefault(require("../repositories/designation.repository"));
const common_dto_1 = require("../dtos/common.dto");
const EmployeeActivity_1 = require("../../../models/EmployeeActivity");
class EmployeeService {
    /**
     * Create a new employee
     */
    async createEmployee(employeeData, userId) {
        // Check if employee code already exists
        const codeExists = await employee_repository_1.default.codeExists(employeeData.employeeCode);
        if (codeExists) {
            throw new Error(`Employee code ${employeeData.employeeCode} already exists`);
        }
        // Check if user already has an employee record
        if (employeeData.userId) {
            const userExists = await employee_repository_1.default.userIdExists(employeeData.userId);
            if (userExists) {
                throw new Error('User already has an employee record');
            }
        }
        // Verify department exists
        const department = await department_repository_1.default.findById(employeeData.departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        // Verify designation exists
        const designation = await designation_repository_1.default.findById(employeeData.designationId);
        if (!designation) {
            throw new Error('Designation not found');
        }
        // Verify manager exists if provided
        if (employeeData.managerId) {
            const manager = await employee_repository_1.default.findById(employeeData.managerId);
            if (!manager) {
                throw new Error('Manager not found');
            }
        }
        // Create employee
        const employee = await employee_repository_1.default.create({
            ...employeeData,
            employeeCode: employeeData.employeeCode.toUpperCase(),
            createdBy: userId,
            employmentStatus: Employee_1.EmploymentStatus.PROBATION,
        });
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: employee._id.toString(),
            activityType: EmployeeActivity_1.ActivityType.JOINED,
            title: 'Employee Joined',
            description: `${employeeData.firstName} ${employeeData.lastName} joined the company`,
            newValue: {
                joinDate: employeeData.joiningDate,
                department: employeeData.departmentId,
                designation: employeeData.designationId,
            },
            createdBy: userId,
        });
        return employee;
    }
    /**
     * Get employee by ID
     */
    async getEmployee(employeeId) {
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return employee;
    }
    /**
     * Get employee by code
     */
    async getEmployeeByCode(employeeCode) {
        const employee = await employee_repository_1.default.findByCode(employeeCode);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return employee;
    }
    /**
     * Update employee
     */
    async updateEmployee(employeeId, updateData, userId) {
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Verify new department if provided
        if (updateData.departmentId) {
            const department = await department_repository_1.default.findById(updateData.departmentId);
            if (!department) {
                throw new Error('Department not found');
            }
        }
        // Verify new designation if provided
        if (updateData.designationId) {
            const designation = await designation_repository_1.default.findById(updateData.designationId);
            if (!designation) {
                throw new Error('Designation not found');
            }
        }
        // Verify new manager if provided
        if (updateData.managerId) {
            const manager = await employee_repository_1.default.findById(updateData.managerId);
            if (!manager) {
                throw new Error('Manager not found');
            }
        }
        // Update employee
        const updatedEmployee = await employee_repository_1.default.update(employeeId, {
            ...updateData,
            updatedBy: userId,
        });
        if (!updatedEmployee) {
            throw new Error('Failed to update employee');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId,
            activityType: EmployeeActivity_1.ActivityType.PROFILE_UPDATED,
            title: 'Profile Updated',
            description: `${employee.firstName} ${employee.lastName}'s profile was updated`,
            previousValue: {
                phone: employee.phone,
                location: employee.workLocation,
            },
            newValue: {
                phone: updateData.phone || employee.phone,
                location: updateData.workLocation || employee.workLocation,
            },
            createdBy: userId,
        });
        return updatedEmployee;
    }
    /**
     * Promote employee to new designation
     */
    async promoteEmployee(promotionData, userId) {
        const employee = await employee_repository_1.default.findById(promotionData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Verify new designation exists
        const designation = await designation_repository_1.default.findById(promotionData.designationId);
        if (!designation) {
            throw new Error('Designation not found');
        }
        const oldDesignation = designation.title;
        // Update employee
        const updateData = {
            designationId: promotionData.designationId,
            updatedBy: userId,
        };
        if (promotionData.departmentId) {
            updateData.departmentId = promotionData.departmentId;
        }
        if (promotionData.salaryGrade) {
            updateData.salaryGrade = promotionData.salaryGrade;
        }
        const updatedEmployee = await employee_repository_1.default.update(promotionData.employeeId, updateData);
        if (!updatedEmployee) {
            throw new Error('Failed to promote employee');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: promotionData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.PROMOTION,
            title: 'Employee Promoted',
            description: `${employee.firstName} ${employee.lastName} was promoted to ${designation.title}`,
            previousValue: { designation: oldDesignation },
            newValue: { designation: designation.title },
            metadata: { promotionDate: new Date() },
            createdBy: userId,
        });
        return updatedEmployee;
    }
    /**
     * Transfer employee to different department
     */
    async transferEmployee(transferData, userId) {
        const employee = await employee_repository_1.default.findById(transferData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Verify new department exists
        const department = await department_repository_1.default.findById(transferData.departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        const oldDepartment = employee.departmentId;
        // Update employee
        const updateData = {
            departmentId: transferData.departmentId,
            updatedBy: userId,
        };
        if (transferData.designationId) {
            updateData.designationId = transferData.designationId;
        }
        if (transferData.managerId) {
            updateData.managerId = transferData.managerId;
        }
        const updatedEmployee = await employee_repository_1.default.update(transferData.employeeId, updateData);
        if (!updatedEmployee) {
            throw new Error('Failed to transfer employee');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: transferData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.DEPARTMENT_CHANGED,
            title: 'Department Changed',
            description: `${employee.firstName} ${employee.lastName} was transferred to ${department.name}`,
            previousValue: { department: oldDepartment },
            newValue: { department: transferData.departmentId },
            metadata: { transferDate: new Date() },
            createdBy: userId,
        });
        return updatedEmployee;
    }
    /**
     * Change employee status
     */
    async changeEmployeeStatus(statusData, userId) {
        const employee = await employee_repository_1.default.findById(statusData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const oldStatus = employee.employmentStatus;
        // Update employee
        const updatedEmployee = await employee_repository_1.default.update(statusData.employeeId, {
            employmentStatus: statusData.employmentStatus,
            updatedBy: userId,
        });
        if (!updatedEmployee) {
            throw new Error('Failed to change employee status');
        }
        // Determine activity type
        let activityType = EmployeeActivity_1.ActivityType.STATUS_CHANGED;
        let title = 'Status Changed';
        if (statusData.employmentStatus === Employee_1.EmploymentStatus.RESIGNED) {
            activityType = EmployeeActivity_1.ActivityType.RESIGNED;
            title = 'Employee Resigned';
        }
        else if (statusData.employmentStatus === Employee_1.EmploymentStatus.TERMINATED) {
            activityType = EmployeeActivity_1.ActivityType.TERMINATED;
            title = 'Employee Terminated';
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: statusData.employeeId,
            activityType,
            title,
            description: `${employee.firstName} ${employee.lastName}'s status changed to ${statusData.employmentStatus}. Reason: ${statusData.reason || 'N/A'}`,
            previousValue: { status: oldStatus },
            newValue: { status: statusData.employmentStatus },
            metadata: {
                effectiveDate: statusData.effectiveDate || new Date(),
                reason: statusData.reason,
            },
            createdBy: userId,
        });
        return updatedEmployee;
    }
    /**
     * Delete employee (soft delete)
     */
    async deleteEmployee(employeeId, userId) {
        const employee = await employee_repository_1.default.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        await employee_repository_1.default.softDelete(employeeId);
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId,
            activityType: EmployeeActivity_1.ActivityType.TERMINATED,
            title: 'Record Deleted',
            description: `${employee.firstName} ${employee.lastName}'s employee record was deleted`,
            createdBy: userId,
        });
    }
    /**
     * List employees with pagination and filters
     */
    async listEmployees(query, pagination) {
        const { employees, total } = await employee_repository_1.default.findWithPagination(query, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(employees, total, page, limit);
    }
    /**
     * Search employees
     */
    async searchEmployees(searchTerm, pagination) {
        const { employees, total } = await employee_repository_1.default.search(searchTerm, pagination);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(employees, total, page, limit);
    }
    /**
     * Get employee directory
     */
    async getEmployeeDirectory(pagination) {
        const { employees, total } = await employee_repository_1.default.findWithPagination({ employmentStatus: Employee_1.EmploymentStatus.ACTIVE }, pagination);
        const directory = employees.map((emp) => ({
            _id: emp._id.toString(),
            employeeCode: emp.employeeCode,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            departmentId: emp.departmentId.toString(),
            designationId: emp.designationId.toString(),
            profileImage: emp.profileImage,
            workLocation: emp.workLocation,
        }));
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(directory, total, page, limit);
    }
    /**
     * Add skill to employee
     */
    async addSkill(skillData, userId) {
        const employee = await employee_repository_1.default.findById(skillData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const updated = await employee_repository_1.default.addSkill(skillData.employeeId, skillData.skill);
        if (!updated) {
            throw new Error('Failed to add skill');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: skillData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.SKILL_ADDED,
            title: 'Skill Added',
            description: `Added skill: ${skillData.skill}`,
            newValue: { skill: skillData.skill },
            createdBy: userId,
        });
        return updated;
    }
    /**
     * Remove skill from employee
     */
    async removeSkill(skillData, userId) {
        const employee = await employee_repository_1.default.findById(skillData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const updated = await employee_repository_1.default.removeSkill(skillData.employeeId, skillData.skill);
        if (!updated) {
            throw new Error('Failed to remove skill');
        }
        return updated;
    }
    /**
     * Add education to employee
     */
    async addEducation(educationData, userId) {
        const employee = await employee_repository_1.default.findById(educationData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const updated = await employee_repository_1.default.addEducation(educationData.employeeId, {
            institution: educationData.institution,
            degree: educationData.degree,
            field: educationData.field,
            graduationYear: educationData.graduationYear,
        });
        if (!updated) {
            throw new Error('Failed to add education');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: educationData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.PROFILE_UPDATED,
            title: 'Education Added',
            description: `Added education: ${educationData.degree} from ${educationData.institution}`,
            newValue: {
                degree: educationData.degree,
                institution: educationData.institution,
            },
            createdBy: userId,
        });
        return updated;
    }
    /**
     * Add certification to employee
     */
    async addCertification(certData, userId) {
        const employee = await employee_repository_1.default.findById(certData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const updated = await employee_repository_1.default.addCertification(certData.employeeId, {
            name: certData.name,
            issuer: certData.issuer,
            issueDate: certData.issueDate,
            expiryDate: certData.expiryDate,
            certificateUrl: certData.certificateUrl,
        });
        if (!updated) {
            throw new Error('Failed to add certification');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: certData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.CERTIFICATION_ADDED,
            title: 'Certification Added',
            description: `Added certification: ${certData.name}`,
            newValue: {
                certification: certData.name,
                issuer: certData.issuer,
            },
            createdBy: userId,
        });
        return updated;
    }
    /**
     * Upload document for employee
     */
    async uploadDocument(docData, userId) {
        const employee = await employee_repository_1.default.findById(docData.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }
        const updated = await employee_repository_1.default.addDocument(docData.employeeId, {
            fileName: docData.fileName,
            fileType: docData.fileType,
            fileUrl: docData.fileUrl,
            uploadedAt: new Date(),
        });
        if (!updated) {
            throw new Error('Failed to upload document');
        }
        // Log activity
        await employee_activity_repository_1.default.create({
            employeeId: docData.employeeId,
            activityType: EmployeeActivity_1.ActivityType.DOCUMENT_ADDED,
            title: 'Document Uploaded',
            description: `Uploaded document: ${docData.fileName}`,
            newValue: {
                fileName: docData.fileName,
                fileType: docData.fileType,
            },
            createdBy: userId,
        });
        return updated;
    }
    /**
     * Get organization hierarchy
     */
    async getOrganizationHierarchy() {
        const employees = await employee_repository_1.default.findByMultipleCriteria({
            statuses: [Employee_1.EmploymentStatus.ACTIVE],
        });
        // Find CEO (employee with no manager)
        const ceoList = employees.filter((emp) => !emp.managerId);
        const ceo = ceoList.length > 0 ? ceoList[0] : null;
        const nodeMap = new Map();
        // Build hierarchy nodes
        employees.forEach((emp) => {
            nodeMap.set(emp._id.toString(), {
                _id: emp._id.toString(),
                firstName: emp.firstName,
                lastName: emp.lastName,
                employeeCode: emp.employeeCode,
                email: emp.email,
                designationId: emp.designationId.toString(),
                departmentId: emp.departmentId.toString(),
                profileImage: emp.profileImage,
                children: [],
            });
        });
        // Build relationships
        employees.forEach((emp) => {
            if (emp.managerId) {
                const managerId = emp.managerId.toString();
                const managerNode = nodeMap.get(managerId);
                const empNode = nodeMap.get(emp._id.toString());
                if (managerNode && empNode) {
                    if (!managerNode.children) {
                        managerNode.children = [];
                    }
                    managerNode.children.push(empNode);
                }
            }
        });
        const rootNode = ceo
            ? nodeMap.get(ceo._id.toString()) || null
            : null;
        return {
            rootNode,
            totalEmployees: employees.length,
            totalManagers: employees.filter((emp) => employees.some((other) => other.managerId?.toString() === emp._id.toString())).length,
            totalDepartments: new Set(employees.map((emp) => emp.departmentId.toString())).size,
        };
    }
    /**
     * Get team members of a manager
     */
    async getTeamMembers(managerId, pagination) {
        const { employees, total } = await employee_repository_1.default.getDirectReports(managerId);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        return (0, common_dto_1.createPaginatedResponse)(employees, employees.length, page, limit);
    }
    /**
     * Get employee statistics
     */
    async getEmployeeStats() {
        const [active, onLeave, probation, resigned, terminated, total] = await Promise.all([
            employee_repository_1.default.countByStatus(Employee_1.EmploymentStatus.ACTIVE),
            employee_repository_1.default.countByStatus(Employee_1.EmploymentStatus.ON_LEAVE),
            employee_repository_1.default.countByStatus(Employee_1.EmploymentStatus.PROBATION),
            employee_repository_1.default.countByStatus(Employee_1.EmploymentStatus.RESIGNED),
            employee_repository_1.default.countByStatus(Employee_1.EmploymentStatus.TERMINATED),
            employee_repository_1.default.findWithPagination({}, { page: 1, limit: 1 }).then((r) => r.total),
        ]);
        return {
            totalEmployees: total,
            activeEmployees: active,
            onLeave,
            probation,
            resigned,
            terminated,
        };
    }
    /**
     * Bulk update employees
     */
    async bulkUpdateEmployees(batchData, userId) {
        const result = await employee_repository_1.default.bulkUpdate(batchData.employeeIds, { ...batchData.updates, updatedBy: userId });
        return {
            success: result.modifiedCount,
            failed: batchData.employeeIds.length - result.modifiedCount,
        };
    }
}
exports.EmployeeService = EmployeeService;
exports.default = new EmployeeService();
