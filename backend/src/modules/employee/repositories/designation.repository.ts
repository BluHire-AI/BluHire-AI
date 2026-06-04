import DesignationModel, { IDesignation } from '../../../models/Designation';
import { PaginationDTO } from '../dtos/common.dto';
import { DesignationQueryDTO } from '../dtos/designation.dto';

export class DesignationRepository {
  /**
   * Create a new designation
   */
  async create(designationData: Partial<IDesignation>): Promise<IDesignation> {
    const designation = new DesignationModel(designationData);
    return await designation.save();
  }

  /**
   * Get designation by ID
   */
  async findById(designationId: string): Promise<IDesignation | null> {
    return await DesignationModel.findById(designationId)
      .populate('departmentId', 'name');
  }

  /**
   * Get designation by title
   */
  async findByTitle(
    title: string,
    departmentId?: string
  ): Promise<IDesignation | null> {
    const filter: any = { title: { $regex: title, $options: 'i' } };
    if (departmentId) filter.departmentId = departmentId;

    return await DesignationModel.findOne(filter)
      .populate('departmentId', 'name');
  }

  /**
   * Update designation
   */
  async update(
    designationId: string,
    updateData: Partial<IDesignation>
  ): Promise<IDesignation | null> {
    return await DesignationModel.findByIdAndUpdate(
      designationId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('departmentId', 'name');
  }

  /**
   * Delete designation
   */
  async delete(designationId: string): Promise<void> {
    await DesignationModel.findByIdAndDelete(designationId);
  }

  /**
   * List designations with pagination
   */
  async findWithPagination(
    query: DesignationQueryDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ designations: IDesignation[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.level !== undefined) filter.level = query.level;

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
    const sort: any = { [sortBy]: sortOrder };

    const [designations, total] = await Promise.all([
      DesignationModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('departmentId', 'name'),
      DesignationModel.countDocuments(filter),
    ]);

    return { designations, total };
  }

  /**
   * Get designations by department
   */
  async findByDepartment(
    departmentId: string,
    pagination?: PaginationDTO
  ): Promise<{ designations: IDesignation[]; total: number }> {
    return this.findWithPagination(
      { departmentId },
      pagination
    );
  }

  /**
   * Get designations by level
   */
  async findByLevel(
    level: number,
    pagination?: PaginationDTO
  ): Promise<{ designations: IDesignation[]; total: number }> {
    return this.findWithPagination(
      { level },
      pagination
    );
  }

  /**
   * Get all designations
   */
  async findAll(): Promise<IDesignation[]> {
    return await DesignationModel.find()
      .sort({ title: 1 })
      .populate('departmentId', 'name');
  }

  /**
   * Check if designation title exists
   */
  async titleExists(
    title: string,
    departmentId: string,
    excludeDesignationId?: string
  ): Promise<boolean> {
    const filter: any = {
      title: { $regex: `^${title}$`, $options: 'i' },
      departmentId,
    };
    if (excludeDesignationId) {
      filter._id = { $ne: excludeDesignationId };
    }
    const count = await DesignationModel.countDocuments(filter);
    return count > 0;
  }

  /**
   * Count total designations
   */
  async countAll(): Promise<number> {
    return await DesignationModel.countDocuments();
  }

  /**
   * Count designations by department
   */
  async countByDepartment(departmentId: string): Promise<number> {
    return await DesignationModel.countDocuments({ departmentId });
  }

  /**
   * Get designations by level range
   */
  async findByLevelRange(
    minLevel: number,
    maxLevel: number
  ): Promise<IDesignation[]> {
    return await DesignationModel.find({
      level: { $gte: minLevel, $lte: maxLevel },
    })
      .sort({ level: 1, title: 1 })
      .populate('departmentId', 'name');
  }

  /**
   * Get all available levels
   */
  async getAllLevels(): Promise<number[]> {
    const levels = await DesignationModel.distinct('level');
    return levels.sort((a: number, b: number) => a - b);
  }

  /**
   * Bulk update designations
   */
  async bulkUpdate(
    designationIds: string[],
    updateData: Partial<IDesignation>
  ): Promise<{ modifiedCount: number }> {
    const result = await DesignationModel.updateMany(
      { _id: { $in: designationIds } },
      { ...updateData, updatedAt: new Date() },
      { runValidators: true }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Search designations
   */
  async search(
    searchTerm: string,
    pagination?: PaginationDTO
  ): Promise<{ designations: IDesignation[]; total: number }> {
    return this.findWithPagination(
      { search: searchTerm },
      pagination
    );
  }
}

export default new DesignationRepository();
