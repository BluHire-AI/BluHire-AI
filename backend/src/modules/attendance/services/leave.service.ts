import { leaveRepository } from '../repositories';
import { ApplyLeaveDto, UpdateLeaveStatusDto, LeaveQueryDto } from '../dtos/leave.dto';
import { ILeave, LeaveStatus } from '../../../models/Leave';
import ApiError from '../../../utils/ApiError';
// Note: Employee model check usually happens via employee service but we'll assume valid employeeId for now

export class LeaveService {
  async applyLeave(employeeId: string, data: ApplyLeaveDto): Promise<ILeave> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate > endDate) {
      throw new ApiError(400, 'Start date cannot be after end date');
    }

    // Check for overlapping leaves
    const overlaps = await leaveRepository.findOverlappingLeaves(employeeId, startDate, endDate);
    if (overlaps.length > 0) {
      throw new ApiError(400, 'You already have an overlapping leave request for this period');
    }

    return await leaveRepository.create({
      employeeId,
      ...data,
      startDate,
      endDate,
      status: LeaveStatus.PENDING
    });
  }

  async getLeaveById(id: string): Promise<ILeave> {
    const leave = await leaveRepository.findById(id);
    if (!leave) {
      throw new ApiError(404, 'Leave not found');
    }
    return leave;
  }

  async updateLeaveStatus(id: string, approverId: string, data: UpdateLeaveStatusDto): Promise<ILeave> {
    const leave = await leaveRepository.findById(id);
    if (!leave) {
      throw new ApiError(404, 'Leave not found');
    }

    if (leave.status === LeaveStatus.CANCELLED) {
      throw new ApiError(400, 'Cannot change status of a cancelled leave');
    }

    return await leaveRepository.update(id, {
      status: data.status as LeaveStatus,
      approvedBy: data.status === LeaveStatus.APPROVED ? approverId : undefined,
      approvedAt: data.status === LeaveStatus.APPROVED ? new Date() : undefined,
    }) as ILeave;
  }

  async cancelLeave(id: string, employeeId: string): Promise<ILeave> {
    const leave = await leaveRepository.findById(id);
    if (!leave) {
      throw new ApiError(404, 'Leave not found');
    }

    if (leave.employeeId.toString() !== employeeId) {
      throw new ApiError(403, 'You can only cancel your own leave');
    }

    if (leave.status === LeaveStatus.REJECTED || leave.status === LeaveStatus.CANCELLED) {
      throw new ApiError(400, `Cannot cancel a leave that is already ${leave.status}`);
    }

    return await leaveRepository.update(id, { status: LeaveStatus.CANCELLED }) as ILeave;
  }

  async getLeaves(query: LeaveQueryDto): Promise<{ records: ILeave[]; total: number }> {
    return await leaveRepository.findWithPagination(query);
  }
}

export default new LeaveService();
