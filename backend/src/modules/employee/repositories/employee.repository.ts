import EmployeeModel, { IEmployee, EmploymentStatus, EmploymentType } from '../../../models/Employee';
import { PaginationDTO } from '../dtos/common.dto';
import { EmployeeQueryDTO } from '../dtos/employee.dto';

export class EmployeeRepository {
  /**
   * Create a new employee
   */
  async create(employeeData: Partial<IEmployee>): Promise<IEmployee> {
    const employee = new EmployeeModel(employeeData);
    return await employee.save();
  }

  /**
   * Get employee by ID
   */
  async findById(employeeId: string): Promise<IEmployee | null> {
    return await EmployeeModel.findOne({
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
  async findByCode(employeeCode: string): Promise<IEmployee | null> {
    return await EmployeeModel.findOne({
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
  async findByUserId(userId: string): Promise<IEmployee | null> {
    return await EmployeeModel.findOne({
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
  async update(
    employeeId: string,
    updateData: Partial<IEmployee>
  ): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      { ...updateData, updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('userId', 'firstName lastName email role')
      .populate('departmentId', 'name')
      .populate('designationId', 'title level')
      .populate('managerId', 'firstName lastName email employeeCode');
  }

  /**
   * Soft delete employee
   */
  async softDelete(employeeId: string): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      { isDeleted: true, updatedAt: new Date() },
      { returnDocument: 'after' }
    );
  }

  /**
   * Hard delete employee (only for testing/admin)
   */
  async hardDelete(employeeId: string): Promise<void> {
    await EmployeeModel.findByIdAndDelete(employeeId);
  }

  /**
   * List employees with pagination and filters
   */
  async findWithPagination(
    query: EmployeeQueryDTO,
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ employees: IEmployee[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };

    // Apply filters
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.designationId) filter.designationId = query.designationId;
    if (query.managerId) filter.managerId = query.managerId;
    if (query.employmentStatus) filter.employmentStatus = query.employmentStatus;
    if (query.employmentType) filter.employmentType = query.employmentType;
    if (query.workLocation) filter.workLocation = query.workLocation;

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
    const sort: any = { [sortBy]: sortOrder };

    const [employees, total] = await Promise.all([
      EmployeeModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .populate('departmentId', 'name')
        .populate('designationId', 'title level')
        .populate('managerId', 'firstName lastName email employeeCode'),
      EmployeeModel.countDocuments(filter),
    ]);

    return { employees, total };
  }

  /**
   * Get employees by department
   */
  async findByDepartment(
    departmentId: string,
    pagination?: PaginationDTO
  ): Promise<{ employees: IEmployee[]; total: number }> {
    return this.findWithPagination(
      { departmentId },
      pagination
    );
  }

  /**
   * Get employees by manager (team members)
   */
  async findByManager(
    managerId: string,
    pagination?: PaginationDTO
  ): Promise<{ employees: IEmployee[]; total: number }> {
    return this.findWithPagination(
      { managerId },
      pagination
    );
  }

  /**
   * Get employees by status
   */
  async findByStatus(
    status: EmploymentStatus,
    pagination?: PaginationDTO
  ): Promise<{ employees: IEmployee[]; total: number }> {
    return this.findWithPagination(
      { employmentStatus: status },
      pagination
    );
  }

  /**
   * Get employees by employment type
   */
  async findByEmploymentType(
    type: EmploymentType,
    pagination?: PaginationDTO
  ): Promise<{ employees: IEmployee[]; total: number }> {
    return this.findWithPagination(
      { employmentType: type },
      pagination
    );
  }

  /**
   * Search employees
   */
  async search(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<{ employees: IEmployee[]; total: number }> {
    return this.findWithPagination(
      { search: searchTerm },
      pagination
    );
  }

  /**
   * Get all managers (employees who manage others)
   */
  async getAllManagers(): Promise<IEmployee[]> {
    return await EmployeeModel.find({
      isDeleted: false,
      _id: { $in: (await EmployeeModel.distinct('managerId', { isDeleted: false, managerId: { $ne: null } })) },
    })
      .select('_id firstName lastName email employeeCode designationId departmentId')
      .populate('departmentId', 'name')
      .populate('designationId', 'title');
  }

  /**
   * Get employee count by status
   */
  async countByStatus(
    status: EmploymentStatus
  ): Promise<number> {
    return await EmployeeModel.countDocuments({
      employmentStatus: status,
      isDeleted: false,
    });
  }

  /**
   * Get employee count by department
   */
  async countByDepartment(
    departmentId: string
  ): Promise<number> {
    return await EmployeeModel.countDocuments({
      departmentId,
      isDeleted: false,
    });
  }

  /**
   * Get employee count by designation
   */
  async countByDesignation(
    designationId: string
  ): Promise<number> {
    return await EmployeeModel.countDocuments({
      designationId,
      isDeleted: false,
    });
  }

  /**
   * Check if employee code exists
   */
  async codeExists(employeeCode: string): Promise<boolean> {
    const count = await EmployeeModel.countDocuments({
      employeeCode: employeeCode.toUpperCase(),
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Check if user ID already has an employee record
   */
  async userIdExists(userId: string): Promise<boolean> {
    const count = await EmployeeModel.countDocuments({
      userId,
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Get total active employees
   */
  async countActiveEmployees(): Promise<number> {
    return await EmployeeModel.countDocuments({
      employmentStatus: EmploymentStatus.ACTIVE,
      isDeleted: false,
    });
  }

  /**
   * Get employees by multiple criteria
   */
  async findByMultipleCriteria(criteria: {
    departmentIds?: string[];
    designationIds?: string[];
    statuses?: EmploymentStatus[];
    types?: EmploymentType[];
  }): Promise<IEmployee[]> {
    const filter: any = { isDeleted: false };

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

    return await EmployeeModel.find(filter)
      .populate('userId', 'firstName lastName email role')
      .populate('departmentId', 'name')
      .populate('designationId', 'title level')
      .populate('managerId', 'firstName lastName email employeeCode');
  }

  /**
   * Get employee reports (direct reports of manager)
   */
  async getDirectReports(
    managerId: string,
    includeInactive: boolean = false
  ): Promise<IEmployee[]> {
    const filter: any = {
      managerId,
      isDeleted: false,
    };

    if (!includeInactive) {
      filter.employmentStatus = EmploymentStatus.ACTIVE;
    }

    return await EmployeeModel.find(filter)
      .select('_id firstName lastName email employeeCode designationId departmentId profileImage')
      .populate('departmentId', 'name')
      .populate('designationId', 'title');
  }

  /**
   * Bulk update employees
   */
  async bulkUpdate(
    employeeIds: string[],
    updateData: Partial<IEmployee>
  ): Promise<{ modifiedCount: number }> {
    const result = await EmployeeModel.updateMany(
      { _id: { $in: employeeIds }, isDeleted: false },
      { ...updateData, updatedAt: new Date() },
      { runValidators: true }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Add skill to employee
   */
  async addSkill(employeeId: string, skill: string): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $addToSet: { skills: skill },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Remove skill from employee
   */
  async removeSkill(employeeId: string, skill: string): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $pull: { skills: skill },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Add education to employee
   */
  async addEducation(
    employeeId: string,
    education: {
      institution: string;
      degree: string;
      field: string;
      graduationYear: number;
    }
  ): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $push: { education },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Add certification to employee
   */
  async addCertification(
    employeeId: string,
    certification: {
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate?: Date;
      certificateUrl?: string;
    }
  ): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $push: { certifications: certification },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Add document to employee
   */
  async addDocument(
    employeeId: string,
    document: {
      fileName: string;
      fileType: string;
      fileUrl: string;
      uploadedAt: Date;
    }
  ): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $push: { documents: document },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Remove document from employee
   */
  async removeDocument(employeeId: string, documentFileName: string): Promise<IEmployee | null> {
    return await EmployeeModel.findByIdAndUpdate(
      employeeId,
      {
        $pull: { documents: { fileName: documentFileName } },
        updatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
  }
}

export default new EmployeeRepository();
