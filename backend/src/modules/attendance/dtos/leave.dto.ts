export interface ApplyLeaveDto {
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
}

export interface UpdateLeaveStatusDto {
  status: string; // PENDING, APPROVED, REJECTED, CANCELLED
}

export interface LeaveQueryDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
}
