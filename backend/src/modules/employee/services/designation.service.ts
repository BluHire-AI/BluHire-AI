import { IDesignation } from '../../../models/Designation';
import DesignationRepository from '../repositories/designation.repository';
import DepartmentRepository from '../repositories/department.repository';
import {
  CreateDesignationDTO,
  UpdateDesignationDTO,
  DesignationQueryDTO,
} from '../dtos/designation.dto';
import { PaginationDTO, createPaginatedResponse } from '../dtos/common.dto';

export class DesignationService {
  /**
   * Create a new designation
   */
  async createDesignation(
    designationData: CreateDesignationDTO,
    userId: string
  ): Promise<IDesignation> {
    // Verify department exists
    const department = await DepartmentRepository.findById(designationData.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if designation title already exists in this department
    const titleExists = await DesignationRepository.titleExists(
      designationData.title,
      designationData.departmentId
    );
    if (titleExists) {
      throw new Error(
        `Designation "${designationData.title}" already exists in this department`
      );
    }

    // Validate level
    if (designationData.level < 1 || designationData.level > 7) {
      throw new Error('Designation level must be between 1 and 7');
    }

    // Create designation
    return await DesignationRepository.create({
      title: designationData.title,
      description: designationData.description,
      departmentId: designationData.departmentId,
      level: designationData.level,
    });
  }

  /**
   * Get designation by ID
   */
  async getDesignation(designationId: string): Promise<IDesignation> {
    const designation = await DesignationRepository.findById(designationId);
    if (!designation) {
      throw new Error('Designation not found');
    }
    return designation;
  }

  /**
   * Update designation
   */
  async updateDesignation(
    designationId: string,
    updateData: UpdateDesignationDTO,
    userId: string
  ): Promise<IDesignation> {
    const designation = await DesignationRepository.findById(designationId);
    if (!designation) {
      throw new Error('Designation not found');
    }

    // Verify new department if provided
    if (updateData.departmentId) {
      const department = await DepartmentRepository.findById(updateData.departmentId);
      if (!department) {
        throw new Error('Department not found');
      }
    }

    // Check if new title already exists
    if (updateData.title) {
      const titleExists = await DesignationRepository.titleExists(
        updateData.title,
        updateData.departmentId || designation.departmentId.toString(),
        designationId
      );
      if (titleExists) {
        throw new Error(`Designation "${updateData.title}" already exists in this department`);
      }
    }

    // Validate level if provided
    if (updateData.level && (updateData.level < 1 || updateData.level > 7)) {
      throw new Error('Designation level must be between 1 and 7');
    }

    // Update designation
    const updated = await DesignationRepository.update(designationId, updateData);
    if (!updated) {
      throw new Error('Failed to update designation');
    }

    return updated;
  }

  /**
   * Delete designation
   */
  async deleteDesignation(designationId: string): Promise<void> {
    const designation = await DesignationRepository.findById(designationId);
    if (!designation) {
      throw new Error('Designation not found');
    }

    // Note: You may want to add additional checks here to prevent deletion
    // if employees are assigned to this designation

    await DesignationRepository.delete(designationId);
  }

  /**
   * List designations with pagination
   */
  async listDesignations(
    query: DesignationQueryDTO = {},
    pagination?: PaginationDTO
  ): Promise<any> {
    const { designations, total } = await DesignationRepository.findWithPagination(
      query,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(designations, total, page, limit);
  }

  /**
   * Get designations by department
   */
  async getDesignationsByDepartment(
    departmentId: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { designations, total } = await DesignationRepository.findByDepartment(
      departmentId,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(designations, total, page, limit);
  }

  /**
   * Get designations by level
   */
  async getDesignationsByLevel(
    level: number,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { designations, total } = await DesignationRepository.findByLevel(
      level,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(designations, total, page, limit);
  }

  /**
   * Get all designations
   */
  async getAllDesignations(): Promise<IDesignation[]> {
    return await DesignationRepository.findAll();
  }

  /**
   * Get designations by level range
   */
  async getDesignationsByLevelRange(
    minLevel: number,
    maxLevel: number
  ): Promise<IDesignation[]> {
    return await DesignationRepository.findByLevelRange(minLevel, maxLevel);
  }

  /**
   * Get all available levels
   */
  async getAllLevels(): Promise<
    Array<{ level: number; name: string; count: number }>
  > {
    const levels = await DesignationRepository.getAllLevels();

    const result = [];
    for (const level of levels) {
      const count = await DesignationRepository.findByLevel(level).then(
        (r) => r.designations.length
      );
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
  async getDesignationStats(): Promise<{
    totalDesignations: number;
    byLevel: Record<number, number>;
  }> {
    const total = await DesignationRepository.countAll();
    const levels = await DesignationRepository.getAllLevels();

    const byLevel: Record<number, number> = {};
    for (const level of levels) {
      const count = await DesignationRepository.findByLevel(level).then(
        (r) => r.designations.length
      );
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
  async searchDesignations(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<any> {
    const { designations, total } = await DesignationRepository.search(
      searchTerm,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return createPaginatedResponse(designations, total, page, limit);
  }

  /**
   * Get level name
   */
  private getLevelName(level: number): string {
    const names: Record<number, string> = {
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

export default new DesignationService();
