import LeaveModel, { ILeave, LeaveStatus } from '../../../models/Leave';
import { LeaveQueryDto } from '../dtos/leave.dto';

export class LeaveRepository {
  async create(data: Partial<ILeave>): Promise<ILeave> {
    const leave = new LeaveModel(data);
    return await leave.save();
  }

  async findById(id: string): Promise<ILeave | null> {
    return await LeaveModel.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('approvedBy', 'firstName lastName');
  }

  async update(id: string, updateData: Partial<ILeave>): Promise<ILeave | null> {
    return await LeaveModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName employeeCode');
  }

  async findWithPagination(query: LeaveQueryDto): Promise<{ records: ILeave[]; total: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.status = query.status;
    if (query.leaveType) filter.leaveType = query.leaveType;

    const [records, total] = await Promise.all([
      LeaveModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'firstName lastName employeeCode departmentId')
        .populate('approvedBy', 'firstName lastName'),
      LeaveModel.countDocuments(filter),
    ]);

    return { records, total };
  }

  async findOverlappingLeaves(employeeId: string, startDate: Date, endDate: Date): Promise<ILeave[]> {
    return await LeaveModel.find({
      employeeId,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });
  }

  async getLeaveBalance(employeeId: string, year: number): Promise<any> {
    // This could be complex if we had a LeaveBalance model, but for now we aggregate approved leaves
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const approvedLeaves = await LeaveModel.find({
      employeeId,
      status: LeaveStatus.APPROVED,
      startDate: { $gte: startOfYear, $lte: endOfYear }
    });

    return approvedLeaves;
  }
}

export default new LeaveRepository();
