import { IEmployee, EmploymentStatus, EmploymentType } from '../../../models/Employee';
import EmployeeRepository from '../repositories/employee.repository';
import EmployeeActivityRepository from '../repositories/employee-activity.repository';
import DepartmentRepository from '../repositories/department.repository';
import DesignationRepository from '../repositories/designation.repository';
import { User } from '../../../models/User';
import { SystemRoles } from '../../../models/roles';
import AttendanceModel from '../../../models/Attendance';
import AttendanceSummaryModel from '../../../models/AttendanceSummary';
import LeaveModel from '../../../models/Leave';
import { EmployeeGoal as EmployeeGoalModel } from '../../../models/EmployeeGoal';
import { PerformanceReview as PerformanceReviewModel } from '../../../models/PerformanceReview';
import EmployeeActivityModel from '../../../models/EmployeeActivity';
import { SkillAssessment as SkillAssessmentModel } from '../../../models/SkillAssessment';
import { PromotionAssessment as PromotionAssessmentModel } from '../../../models/PromotionAssessment';
import { SuccessionPlan as SuccessionPlanModel } from '../../../models/SuccessionPlan';
import { PerformanceRiskAssessment as PerformanceRiskAssessmentModel } from '../../../models/PerformanceRiskAssessment';
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PromoteEmployeeDTO,
  TransferEmployeeDTO,
  ChangeStatusDTO,
  EmployeeQueryDTO,
  AddSkillDTO,
  RemoveSkillDTO,
  AddEducationDTO,
  AddCertificationDTO,
  UploadDocumentDTO,
  BatchUpdateEmployeeDTO,
} from '../dtos/employee.dto';
import { PaginationDTO, createPaginatedResponse } from '../dtos/common.dto';
import { ActivityType } from '../../../models/EmployeeActivity';
import { IHierarchyNode, IOrganizationChart, IEmployeeDirectory } from '../employee.types';

export class EmployeeService {
  /**
   * Create a new employee
   */
  async createEmployee(
    employeeData: CreateEmployeeDTO,
    userId: string
  ): Promise<IEmployee> {
    // Check if employee code already exists
    const codeExists = await EmployeeRepository.codeExists(employeeData.employeeCode);
    if (codeExists) {
      throw new Error(`Employee code ${employeeData.employeeCode} already exists`);
    }

    // Check if user already has an employee record
    if (employeeData.userId) {
      const userExists = await EmployeeRepository.userIdExists(employeeData.userId);
      if (userExists) {
        throw new Error('User already has an employee record');
      }
    }

    // Verify department exists
    const department = await DepartmentRepository.findById(employeeData.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Verify designation exists
    const designation = await DesignationRepository.findById(employeeData.designationId);
    if (!designation) {
      throw new Error('Designation not found');
    }

    // Verify manager exists if provided
    if (employeeData.managerId) {
      const manager = await EmployeeRepository.findById(employeeData.managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    // Create employee
    const employee = await EmployeeRepository.create({
      ...employeeData,
      employeeCode: employeeData.employeeCode.toUpperCase(),
      createdBy: userId,
      employmentStatus: EmploymentStatus.PROBATION,
    });

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: employee._id.toString(),
      activityType: ActivityType.JOINED,
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
  async getEmployee(employeeId: string): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  /**
   * Get employee by code
   */
  async getEmployeeByCode(employeeCode: string): Promise<IEmployee> {
    const employee = await EmployeeRepository.findByCode(employeeCode);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  /**
   * Update employee
   */
  async updateEmployee(
    employeeId: string,
    updateData: UpdateEmployeeDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify new department if provided
    if (updateData.departmentId) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      if (!department) {
        throw new Error('Department not found');
      }
    }

    // Verify new designation if provided
    if (updateData.designationId) {
      const designation = await DesignationRepository.findById(updateData.designationId);
      if (!designation) {
        throw new Error('Designation not found');
      }
    }

    // Verify new manager if provided
    if (updateData.managerId) {
      const manager = await EmployeeRepository.findById(updateData.managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
      await this.checkReportingCycle(employeeId, updateData.managerId);
    }

    // Update employee
    const updatedEmployee = await EmployeeRepository.update(employeeId, {
      ...updateData,
      updatedBy: userId,
    });

    if (!updatedEmployee) {
      throw new Error('Failed to update employee');
    }

    // Log timeline changes
    if (updateData.managerId && String((employee.managerId as any)?._id || employee.managerId || '') !== String(updateData.managerId)) {
      await EmployeeActivityRepository.create({
        employeeId,
        activityType: ActivityType.MANAGER_CHANGED,
        title: 'Manager Changed',
        description: `${employee.firstName} ${employee.lastName}'s reporting manager was changed`,
        previousValue: { managerId: (employee.managerId as any)?._id || employee.managerId || null },
        newValue: { managerId: updateData.managerId },
        createdBy: userId,
      });
    }

    if (updateData.departmentId && String((employee.departmentId as any)?._id || employee.departmentId || '') !== String(updateData.departmentId)) {
      await EmployeeActivityRepository.create({
        employeeId,
        activityType: ActivityType.DEPARTMENT_CHANGED,
        title: 'Department Changed',
        description: `${employee.firstName} ${employee.lastName}'s department was changed`,
        previousValue: { departmentId: (employee.departmentId as any)?._id || employee.departmentId || null },
        newValue: { departmentId: updateData.departmentId },
        createdBy: userId,
      });
    }

    if (updateData.designationId && String((employee.designationId as any)?._id || employee.designationId || '') !== String(updateData.designationId)) {
      await EmployeeActivityRepository.create({
        employeeId,
        activityType: ActivityType.DESIGNATION_CHANGED,
        title: 'Designation Changed',
        description: `${employee.firstName} ${employee.lastName}'s designation was changed`,
        previousValue: { designationId: (employee.designationId as any)?._id || employee.designationId || null },
        newValue: { designationId: updateData.designationId },
        createdBy: userId,
      });
    }

    // Log other profile updates
    const profileFields = ['firstName', 'lastName', 'email', 'phone', 'workLocation', 'experience', 'salaryGrade', 'gender', 'dateOfBirth'];
    const profileChanges: any = {};
    const profilePrevious: any = {};
    
    profileFields.forEach((field) => {
      const val = (updateData as any)[field];
      if (val !== undefined && String(val) !== String((employee as any)[field])) {
        profileChanges[field] = val;
        profilePrevious[field] = (employee as any)[field];
      }
    });

    if (Object.keys(profileChanges).length > 0) {
      await EmployeeActivityRepository.create({
        employeeId,
        activityType: ActivityType.PROFILE_UPDATED,
        title: 'Profile Updated',
        description: `${employee.firstName} ${employee.lastName}'s profile fields were updated: ${Object.keys(profileChanges).join(', ')}`,
        previousValue: profilePrevious,
        newValue: profileChanges,
        createdBy: userId,
      });
    }

    return updatedEmployee;
  }

  /**
   * Promote employee to new designation
   */
  async promoteEmployee(
    promotionData: PromoteEmployeeDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(promotionData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify new designation exists
    const designation = await DesignationRepository.findById(promotionData.designationId);
    if (!designation) {
      throw new Error('Designation not found');
    }

    const oldDesignation = (employee.designationId as any)?.title || 'Unassigned';

    // Update employee
    const updateData: any = {
      designationId: promotionData.designationId,
      updatedBy: userId,
    };

    if (promotionData.departmentId) {
      updateData.departmentId = promotionData.departmentId;
    }

    if (promotionData.salaryGrade) {
      updateData.salaryGrade = promotionData.salaryGrade;
    }

    const updatedEmployee = await EmployeeRepository.update(
      promotionData.employeeId,
      updateData
    );

    if (!updatedEmployee) {
      throw new Error('Failed to promote employee');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: promotionData.employeeId,
      activityType: ActivityType.PROMOTED,
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
  async transferEmployee(
    transferData: TransferEmployeeDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(transferData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify new department exists
    const department = await DepartmentRepository.findById(transferData.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const oldDepartment = (employee.departmentId as any)?.name || 'Unassigned';

    // Update employee
    const updateData: any = {
      departmentId: transferData.departmentId,
      updatedBy: userId,
    };

    if (transferData.designationId) {
      updateData.designationId = transferData.designationId;
    }

    if (transferData.managerId) {
      const manager = await EmployeeRepository.findById(transferData.managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
      await this.checkReportingCycle(transferData.employeeId, transferData.managerId);
      updateData.managerId = transferData.managerId;
    }

    const updatedEmployee = await EmployeeRepository.update(
      transferData.employeeId,
      updateData
    );

    if (!updatedEmployee) {
      throw new Error('Failed to transfer employee');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: transferData.employeeId,
      activityType: ActivityType.TRANSFERRED,
      title: 'Employee Transferred',
      description: `${employee.firstName} ${employee.lastName} was transferred to ${department.name}`,
      previousValue: { department: oldDepartment },
      newValue: { department: department.name },
      metadata: { transferDate: new Date() },
      createdBy: userId,
    });

    return updatedEmployee;
  }

  /**
   * Change employee status
   */
  async changeEmployeeStatus(
    statusData: ChangeStatusDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(statusData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const oldStatus = employee.employmentStatus;

    // Update employee
    const updatedEmployee = await EmployeeRepository.update(
      statusData.employeeId,
      {
        employmentStatus: statusData.employmentStatus,
        updatedBy: userId,
      }
    );

    if (!updatedEmployee) {
      throw new Error('Failed to change employee status');
    }

    // Determine activity type
    let activityType = ActivityType.STATUS_CHANGED;
    let title = 'Status Changed';

    if (statusData.employmentStatus === EmploymentStatus.RESIGNED) {
      activityType = ActivityType.RESIGNED;
      title = 'Employee Resigned';
    } else if (statusData.employmentStatus === EmploymentStatus.TERMINATED) {
      activityType = ActivityType.TERMINATED;
      title = 'Employee Terminated';
    }

    // Log activity
    await EmployeeActivityRepository.create({
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
   * Delete employee with FULL CASCADE:
   * - Soft-deletes the Employee record
   * - Hard-deletes all related HR data (attendance, leaves, goals, reviews, etc.)
   * - Deactivates and demotes the linked User account back to CANDIDATE role
   *   so the same email can be re-hired in the future without conflicts
   */
  async deleteEmployee(employeeId: string, userId: string): Promise<{ summary: Record<string, number> }> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const summary: Record<string, number> = {};

    // 1. Soft-delete the Employee record
    await EmployeeRepository.softDelete(employeeId);
    summary.employee = 1;

    // 2. Hard-delete all HR related records tied to this employee
    const employeeObjectId = employee._id;

    const attendanceResult = await AttendanceModel.deleteMany({ employeeId: employeeObjectId });
    summary.attendance = attendanceResult.deletedCount;

    const attendanceSummaryResult = await AttendanceSummaryModel.deleteMany({ employeeId: employeeObjectId });
    summary.attendanceSummary = attendanceSummaryResult.deletedCount;

    const leaveResult = await LeaveModel.deleteMany({ employeeId: employeeObjectId });
    summary.leaves = leaveResult.deletedCount;

    const goalResult = await EmployeeGoalModel.deleteMany({ employeeId: employeeObjectId });
    summary.goals = goalResult.deletedCount;

    const reviewResult = await PerformanceReviewModel.deleteMany({ employeeId: employeeObjectId });
    summary.performanceReviews = reviewResult.deletedCount;

    const activityResult = await EmployeeActivityModel.deleteMany({ employeeId: employeeObjectId });
    summary.activities = activityResult.deletedCount;

    const skillAssessmentResult = await SkillAssessmentModel.deleteMany({ employeeId: employeeObjectId });
    summary.skillAssessments = skillAssessmentResult.deletedCount;

    const promotionResult = await PromotionAssessmentModel.deleteMany({ employeeId: employeeObjectId });
    summary.promotionAssessments = promotionResult.deletedCount;

    const riskResult = await PerformanceRiskAssessmentModel.deleteMany({ employeeId: employeeObjectId });
    summary.riskAssessments = riskResult.deletedCount;

    // Succession plans can reference this employee as either subject or successor
    const successionResult = await SuccessionPlanModel.deleteMany({
      $or: [{ employeeId: employeeObjectId }, { potentialSuccessors: employeeObjectId }]
    });
    summary.successionPlans = successionResult.deletedCount;

    // 3. Deactivate & demote the linked User account back to CANDIDATE
    //    This is crucial — it allows the same email to be re-hired later
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, {
        isActive: false,
        role: SystemRoles.CANDIDATE,
        refreshToken: null,   // invalidate any active sessions
      });
      summary.userAccountDeactivated = 1;
    } else {
      // Try to find by email if userId not linked
      const linkedUser = await User.findOne({ email: employee.email });
      if (linkedUser) {
        await User.findByIdAndUpdate(linkedUser._id, {
          isActive: false,
          role: SystemRoles.CANDIDATE,
          refreshToken: null,
        });
        summary.userAccountDeactivated = 1;
      }
    }

    console.log(`[CascadeDelete] Employee ${employee.firstName} ${employee.lastName} deleted. Summary:`, summary);

    return { summary };
  }

  /**
   * List employees with pagination and filters
   */
  async listEmployees(
    query: EmployeeQueryDTO,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { employees, total } = await EmployeeRepository.findWithPagination(
      query,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(employees, total, page, limit);
  }

  /**
   * Search employees
   */
  async searchEmployees(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { employees, total } = await EmployeeRepository.search(
      searchTerm,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(employees, total, page, limit);
  }

  /**
   * Get employee directory
   */
  async getEmployeeDirectory(pagination?: PaginationDTO): Promise<any> {
    const { employees, total } = await EmployeeRepository.findWithPagination(
      { employmentStatus: EmploymentStatus.ACTIVE },
      pagination
    );

    const directory: IEmployeeDirectory[] = employees.map((emp) => ({
      _id: emp._id.toString(),
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      departmentId: emp.departmentId ? (
        typeof emp.departmentId === 'object' && '_id' in emp.departmentId
          ? { _id: (emp.departmentId as any)._id.toString(), name: (emp.departmentId as any).name }
          : { _id: emp.departmentId.toString(), name: 'Department Team' }
      ) : null,
      designationId: emp.designationId ? (
        typeof emp.designationId === 'object' && '_id' in emp.designationId
          ? { _id: (emp.designationId as any)._id.toString(), title: (emp.designationId as any).title, level: (emp.designationId as any).level }
          : { _id: emp.designationId.toString(), title: 'Team Member' }
      ) : null,
      profileImage: emp.profileImage,
      workLocation: emp.workLocation,
      skills: emp.skills || []
    }));

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(directory, total, page, limit);
  }

  /**
   * Add skill to employee
   */
  async addSkill(skillData: AddSkillDTO, userId: string): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(skillData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.skills && employee.skills.includes(skillData.skill)) {
      return employee;
    }

    const updated = await EmployeeRepository.addSkill(
      skillData.employeeId,
      skillData.skill
    );

    if (!updated) {
      throw new Error('Failed to add skill');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: skillData.employeeId,
      activityType: ActivityType.SKILL_ADDED,
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
  async removeSkill(skillData: RemoveSkillDTO, userId: string): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(skillData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const updated = await EmployeeRepository.removeSkill(
      skillData.employeeId,
      skillData.skill
    );

    if (!updated) {
      throw new Error('Failed to remove skill');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: skillData.employeeId,
      activityType: ActivityType.SKILL_REMOVED,
      title: 'Skill Removed',
      description: `Removed skill: ${skillData.skill}`,
      previousValue: { skill: skillData.skill },
      createdBy: userId,
    });

    return updated;
  }

  /**
   * Add education to employee
   */
  async addEducation(
    educationData: AddEducationDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(educationData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const updated = await EmployeeRepository.addEducation(educationData.employeeId, {
      institution: educationData.institution,
      degree: educationData.degree,
      field: educationData.field,
      graduationYear: educationData.graduationYear,
    });

    if (!updated) {
      throw new Error('Failed to add education');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: educationData.employeeId,
      activityType: ActivityType.EDUCATION_ADDED,
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
  async addCertification(
    certData: AddCertificationDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(certData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const updated = await EmployeeRepository.addCertification(certData.employeeId, {
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
    await EmployeeActivityRepository.create({
      employeeId: certData.employeeId,
      activityType: ActivityType.CERTIFICATION_ADDED,
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
  async uploadDocument(
    docData: UploadDocumentDTO,
    userId: string
  ): Promise<IEmployee> {
    const employee = await EmployeeRepository.findById(docData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const updated = await EmployeeRepository.addDocument(docData.employeeId, {
      fileName: docData.fileName,
      fileType: docData.fileType,
      fileUrl: docData.fileUrl,
      uploadedAt: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to upload document');
    }

    // Log activity
    await EmployeeActivityRepository.create({
      employeeId: docData.employeeId,
      activityType: ActivityType.DOCUMENT_UPLOADED,
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
  async getOrganizationHierarchy(): Promise<IOrganizationChart> {
    const employees = await EmployeeRepository.findByMultipleCriteria({
      statuses: [EmploymentStatus.ACTIVE],
    });

    console.log("Employees Loaded:", employees.length);

    // Find CEO (employee with no manager)
    const ceoList = employees.filter((emp) => {
      const managerId = emp.managerId && typeof emp.managerId === 'object' && '_id' in emp.managerId
        ? (emp.managerId as any)._id.toString()
        : emp.managerId?.toString();
      return !managerId;
    });
    const ceo = ceoList.length > 0 ? ceoList[0] : null;

    console.log("Roots:", ceoList.length);

    const nodeMap = new Map<string, IHierarchyNode>();

    // Build hierarchy nodes mapping
    employees.forEach((emp) => {
      nodeMap.set(emp._id.toString(), {
        _id: emp._id.toString(),
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeCode: emp.employeeCode,
        email: emp.email,
        profileImage: emp.profileImage,
        designation: emp.designationId && typeof emp.designationId === 'object' ? {
          _id: (emp.designationId as any)._id?.toString() || (emp.designationId as any).id,
          title: (emp.designationId as any).title,
          level: (emp.designationId as any).level,
        } : undefined,
        department: emp.departmentId && typeof emp.departmentId === 'object' ? {
          _id: (emp.departmentId as any)._id?.toString() || (emp.departmentId as any).id,
          name: (emp.departmentId as any).name,
        } : undefined,
        children: [],
      });
    });

    // Temp children lists to build tree
    const rawChildrenMap = new Map<string, string[]>();
    employees.forEach((emp) => {
      const managerId = emp.managerId && typeof emp.managerId === 'object' && '_id' in emp.managerId
        ? (emp.managerId as any)._id.toString()
        : emp.managerId?.toString();
      
      if (managerId) {
        if (!rawChildrenMap.has(managerId)) {
          rawChildrenMap.set(managerId, []);
        }
        rawChildrenMap.get(managerId)!.push(emp._id.toString());
      }
    });

    const visited = new Set<string>();

    const buildTree = (nodeId: string): IHierarchyNode | null => {
      if (visited.has(nodeId)) {
        return null; // Cycle prevention: skip already visited node
      }
      visited.add(nodeId);

      const rawNode = nodeMap.get(nodeId);
      if (!rawNode) return null;

      const node: IHierarchyNode = {
        _id: rawNode._id,
        firstName: rawNode.firstName,
        lastName: rawNode.lastName,
        employeeCode: rawNode.employeeCode,
        email: rawNode.email,
        profileImage: rawNode.profileImage,
        designation: rawNode.designation,
        department: rawNode.department,
        children: [],
      };

      const childrenIds = rawChildrenMap.get(nodeId) || [];
      for (const childId of childrenIds) {
        console.log("Parent:", nodeId);
        console.log("Child Match:", childId);
        const childNode = buildTree(childId);
        if (childNode) {
          node.children!.push(childNode);
        }
      }

      return node;
    };

    const rootNode = ceo ? buildTree(ceo._id.toString()) : null;

    const totalManagers = employees.filter((emp) =>
      employees.some((other) => {
        const otherManagerId = other.managerId && typeof other.managerId === 'object' && '_id' in other.managerId
          ? (other.managerId as any)._id.toString()
          : other.managerId?.toString();
        return otherManagerId === emp._id.toString();
      })
    ).length;

    const uniqueDeptIds = new Set(
      employees
        .map((emp) => {
          if (emp.departmentId && typeof emp.departmentId === 'object' && '_id' in emp.departmentId) {
            return (emp.departmentId as any)._id.toString();
          }
          return emp.departmentId?.toString();
        })
        .filter(Boolean)
    );

    return {
      rootNode,
      totalEmployees: employees.length,
      totalManagers,
      totalDepartments: uniqueDeptIds.size,
    };
  }

  /**
   * Get team members of a manager
   */
  async getTeamMembers(
    managerId: string,
    pagination?: PaginationDTO
  ): Promise<any> {

    const { employees, total } =
      await EmployeeRepository.findByManager(
        managerId,
        pagination
      );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(
      employees,
      total,
      page,
      limit
    );
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    probation: number;
    resigned: number;
    terminated: number;
  }> {
    const [active, onLeave, probation, resigned, terminated, total] = await Promise.all([
      EmployeeRepository.countByStatus(EmploymentStatus.ACTIVE),
      EmployeeRepository.countByStatus(EmploymentStatus.ON_LEAVE),
      EmployeeRepository.countByStatus(EmploymentStatus.PROBATION),
      EmployeeRepository.countByStatus(EmploymentStatus.RESIGNED),
      EmployeeRepository.countByStatus(EmploymentStatus.TERMINATED),
      EmployeeRepository.findWithPagination({}, { page: 1, limit: 1 }).then((r) => r.total),
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
  async bulkUpdateEmployees(
    batchData: BatchUpdateEmployeeDTO,
    userId: string
  ): Promise<{ success: number; failed: number }> {
    const result = await EmployeeRepository.bulkUpdate(
      batchData.employeeIds,
      { ...batchData.updates, updatedBy: userId }
    );

    return {
      success: result.modifiedCount,
      failed: batchData.employeeIds.length - result.modifiedCount,
    };
  }

  /**
   * Helper to check if setting managerId for employeeId creates a cycle
   */
  async checkReportingCycle(employeeId: string, managerId: string): Promise<void> {
    if (!managerId) return;
    
    let currentId = managerId;
    const visited = new Set<string>();
    
    while (currentId) {
      if (currentId.toString() === employeeId.toString()) {
        throw new Error('Cyclic reporting relationship detected: An employee cannot report to themselves or a direct/indirect report.');
      }
      
      if (visited.has(currentId.toString())) {
        break;
      }
      visited.add(currentId.toString());
      
      const managerEmployee = await EmployeeRepository.findById(currentId);
      if (!managerEmployee || !managerEmployee.managerId) {
        break;
      }
      
      currentId = (managerEmployee.managerId as any)._id 
        ? (managerEmployee.managerId as any)._id.toString() 
        : managerEmployee.managerId.toString();
    }
  }
}

export default new EmployeeService();
