import { IDepartment } from '../../../models/Department';
import DepartmentRepository from '../repositories/department.repository';
import EmployeeRepository from '../repositories/employee.repository';
import {
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  DepartmentQueryDTO,
  AssignDepartmentHeadDTO,
} from '../dtos/department.dto';
import { PaginationDTO, createPaginatedResponse } from '../dtos/common.dto';

export class DepartmentService {
  /**
   * Create a new department
   */
  async createDepartment(
    departmentData: CreateDepartmentDTO,
    userId: string
  ): Promise<IDepartment> {
    // Check if department name already exists
    const nameExists = await DepartmentRepository.nameExists(departmentData.name);
    if (nameExists) {
      throw new Error(`Department with name "${departmentData.name}" already exists`);
    }

    // Verify department head exists if provided
    if (departmentData.departmentHead) {
      const head = await EmployeeRepository.findById(departmentData.departmentHead);
      if (!head) {
        throw new Error('Department head not found');
      }
    }

    // Create department
    return await DepartmentRepository.create({
      name: departmentData.name,
      description: departmentData.description,
      departmentHead: departmentData.departmentHead || undefined,
      isActive: true,
    });
  }

  /**
   * Get department by ID
   */
  async getDepartment(departmentId: string): Promise<IDepartment> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
    return department;
  }

  /**
   * Update department
   */
  async updateDepartment(
    departmentId: string,
    updateData: UpdateDepartmentDTO,
    userId: string
  ): Promise<IDepartment> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if new name already exists
    if (updateData.name) {
      const nameExists = await DepartmentRepository.nameExists(
        updateData.name,
        departmentId
      );
      if (nameExists) {
        throw new Error(`Department with name "${updateData.name}" already exists`);
      }
    }

    // Verify new department head exists if provided
    if (updateData.departmentHead) {
      const head = await EmployeeRepository.findById(updateData.departmentHead);
      if (!head) {
        throw new Error('Department head not found');
      }
    }

    // Update department
    const updated = await DepartmentRepository.update(departmentId, updateData);
    if (!updated) {
      throw new Error('Failed to update department');
    }

    return updated;
  }

  /**
   * Delete department
   */
  async deleteDepartment(departmentId: string): Promise<void> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if department has employees
    const employeeCount = await EmployeeRepository.countByDepartment(departmentId);
    if (employeeCount > 0) {
      throw new Error('Cannot delete department with active employees');
    }

    await DepartmentRepository.delete(departmentId);
  }

  /**
   * List departments with pagination
   */
  async listDepartments(
    query: DepartmentQueryDTO = {},
    pagination?: PaginationDTO
  ): Promise<any> {
    const { departments, total } = await DepartmentRepository.findWithPagination(
      query,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(departments, total, page, limit);
  }

  /**
   * Get all active departments
   */
  async getAllActiveDepartments(): Promise<IDepartment[]> {
    return await DepartmentRepository.findAllActive();
  }

  /**
   * Get all departments
   */
  async getAllDepartments(): Promise<IDepartment[]> {
    return await DepartmentRepository.findAll();
  }

  /**
   * Assign or reassign department head
   */
  async assignDepartmentHead(
    assignData: AssignDepartmentHeadDTO,
    userId: string
  ): Promise<IDepartment> {
    // Verify department exists
    const department = await DepartmentRepository.findById(assignData.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Verify employee exists
    const employee = await EmployeeRepository.findById(assignData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify employee belongs to the department
    if (employee.departmentId.toString() !== assignData.departmentId) {
      throw new Error('Employee must belong to the department to be assigned as head');
    }

    const updated = await DepartmentRepository.assignHead(
      assignData.departmentId,
      assignData.employeeId
    );

    if (!updated) {
      throw new Error('Failed to assign department head');
    }

    return updated;
  }

  /**
   * Remove department head
   */
  async removeDepartmentHead(departmentId: string): Promise<IDepartment> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const updated = await DepartmentRepository.removeHead(departmentId);
    if (!updated) {
      throw new Error('Failed to remove department head');
    }

    return updated;
  }

  /**
   * Toggle department status
   */
  async toggleDepartmentStatus(departmentId: string): Promise<IDepartment> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const updated = await DepartmentRepository.toggleStatus(departmentId);
    if (!updated) {
      throw new Error('Failed to toggle department status');
    }

    return updated;
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<{
    totalDepartments: number;
    activeDepartments: number;
    departmentsWithHeads: number;
  }> {
    const [total, active] = await Promise.all([
      DepartmentRepository.countAll(),
      DepartmentRepository.countActive(),
    ]);

    const departments = await DepartmentRepository.findAll();
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
  async getDepartmentWithDetails(departmentId: string): Promise<any> {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const employeeCount = await EmployeeRepository.countByDepartment(departmentId);

    return {
      ...department.toObject(),
      employeeCount,
    };
  }

  /**
   * Search departments
   */
  async searchDepartments(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { departments, total } = await DepartmentRepository.findWithPagination(
      { search: searchTerm },
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(departments, total, page, limit);
  }
}

export default new DepartmentService();
