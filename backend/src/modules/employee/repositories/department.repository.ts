import DepartmentModel, { IDepartment } from '../../../models/Department';
import { PaginationDTO } from '../dtos/common.dto';
import { DepartmentQueryDTO } from '../dtos/department.dto';

export class DepartmentRepository {
  /**
   * Create a new department
   */
  async create(departmentData: Partial<IDepartment>): Promise<IDepartment> {
    const department = new DepartmentModel(departmentData);
    return await department.save();
  }

  /**
   * Get department by ID
   */
  async findById(departmentId: string): Promise<IDepartment | null> {
    return await DepartmentModel.findById(departmentId)
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Get department by name
   */
  async findByName(name: string): Promise<IDepartment | null> {
    return await DepartmentModel.findOne({ name: { $regex: name, $options: 'i' } })
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Update department
   */
  async update(
    departmentId: string,
    updateData: Partial<IDepartment>
  ): Promise<IDepartment | null> {
    return await DepartmentModel.findByIdAndUpdate(
      departmentId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Delete department
   */
  async delete(departmentId: string): Promise<void> {
    await DepartmentModel.findByIdAndDelete(departmentId);
  }

  /**
   * List departments with pagination
   */
  async findWithPagination(
    query: DepartmentQueryDTO = {},
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ departments: IDepartment[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    // Apply search
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
      ];
    }

    // Determine sort
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [departments, total] = await Promise.all([
      DepartmentModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('departmentHead', 'firstName lastName email employeeCode'),
      DepartmentModel.countDocuments(filter),
    ]);

    return { departments, total };
  }

  /**
   * Get all active departments
   */
  async findAllActive(): Promise<IDepartment[]> {
    return await DepartmentModel.find({ isActive: true })
      .sort({ name: 1 })
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Get all departments
   */
  async findAll(): Promise<IDepartment[]> {
    return await DepartmentModel.find()
      .sort({ name: 1 })
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Check if department name exists
   */
  async nameExists(name: string, excludeDepartmentId?: string): Promise<boolean> {
    const filter: any = { name: { $regex: `^${name}$`, $options: 'i' } };
    if (excludeDepartmentId) {
      filter._id = { $ne: excludeDepartmentId };
    }
    const count = await DepartmentModel.countDocuments(filter);
    return count > 0;
  }

  /**
   * Count total departments
   */
  async countAll(): Promise<number> {
    return await DepartmentModel.countDocuments();
  }

  /**
   * Count active departments
   */
  async countActive(): Promise<number> {
    return await DepartmentModel.countDocuments({ isActive: true });
  }

  /**
   * Toggle department status
   */
  async toggleStatus(departmentId: string): Promise<IDepartment | null> {
    const department = await DepartmentModel.findById(departmentId);
    if (!department) return null;

    return await DepartmentModel.findByIdAndUpdate(
      departmentId,
      { isActive: !department.isActive, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Assign department head
   */
  async assignHead(departmentId: string, employeeId: string): Promise<IDepartment | null> {
    return await DepartmentModel.findByIdAndUpdate(
      departmentId,
      { departmentHead: employeeId, updatedAt: new Date() },
      { new: true }
    )
      .populate('departmentHead', 'firstName lastName email employeeCode');
  }

  /**
   * Remove department head
   */
  async removeHead(departmentId: string): Promise<IDepartment | null> {
    return await DepartmentModel.findByIdAndUpdate(
      departmentId,
      { departmentHead: null, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Bulk update departments
   */
  async bulkUpdate(
    departmentIds: string[],
    updateData: Partial<IDepartment>
  ): Promise<{ modifiedCount: number }> {
    const result = await DepartmentModel.updateMany(
      { _id: { $in: departmentIds } },
      { ...updateData, updatedAt: new Date() },
      { runValidators: true }
    );
    return { modifiedCount: result.modifiedCount };
  }
}

export default new DepartmentRepository();
