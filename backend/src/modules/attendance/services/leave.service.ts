import { leaveRepository } from '../repositories';
import { ApplyLeaveDto, UpdateLeaveStatusDto, LeaveQueryDto } from '../dtos/leave.dto';
import { ILeave, LeaveStatus, LeaveType } from '../../../models/Leave';
import ApiError from '../../../utils/ApiError';
import mongoose from 'mongoose';
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
      employeeId: new mongoose.Types.ObjectId(employeeId),
      ...data,
      leaveType: data.leaveType as LeaveType,
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
      approvedBy: data.status === LeaveStatus.APPROVED ? new mongoose.Types.ObjectId(approverId) : undefined,
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

  async getLeaveBalance(employeeId: string, year: number): Promise<any> {
    const approvedLeaves = await leaveRepository.getLeaveBalance(employeeId, year);
    
    const quotas = {
      ANNUAL: 15,
      SICK: 10,
      CASUAL: 7,
      MATERNITY: 90,
      PATERNITY: 10,
      UNPAID: 365,
    };

    const used = {
      ANNUAL: 0,
      SICK: 0,
      CASUAL: 0,
      MATERNITY: 0,
      PATERNITY: 0,
      UNPAID: 0,
    };

    approvedLeaves.forEach((leave: any) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffMs = end.getTime() - start.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
      const type = leave.leaveType as keyof typeof used;
      if (used[type] !== undefined) {
        used[type] += days;
      }
    });

    const balances = {
      ANNUAL: Math.max(0, quotas.ANNUAL - used.ANNUAL),
      SICK: Math.max(0, quotas.SICK - used.SICK),
      CASUAL: Math.max(0, quotas.CASUAL - used.CASUAL),
      MATERNITY: Math.max(0, quotas.MATERNITY - used.MATERNITY),
      PATERNITY: Math.max(0, quotas.PATERNITY - used.PATERNITY),
      UNPAID: Math.max(0, quotas.UNPAID - used.UNPAID),
    };

    return { quotas, used, balances };
  }
}

export default new LeaveService();
