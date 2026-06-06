export interface CheckInDto {
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;
  remarks?: string;
}

export interface CheckOutDto {
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;
  remarks?: string;
}

export interface UpdateAttendanceDto {
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
  attendanceStatus?: string;
  remarks?: string;
}

export interface AttendanceQueryDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}
