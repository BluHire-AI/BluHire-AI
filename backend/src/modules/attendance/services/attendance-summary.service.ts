import { attendanceSummaryRepository, attendanceRepository, leaveRepository } from '../repositories';
import { IAttendanceSummary } from '../../../models/AttendanceSummary';
import { AttendanceStatus } from '../../../models/Attendance';
import EmployeeModel from '../../../models/Employee';

export class AttendanceSummaryService {
  async generateSummaryForEmployee(employeeId: string, month: number, year: number): Promise<IAttendanceSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await attendanceRepository.findByDateRange(employeeId, startDate, endDate);
    
    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let totalHours = 0;
    let overtimeHours = 0;

    for (const att of attendances) {
      if (att.attendanceStatus === AttendanceStatus.PRESENT || 
          att.attendanceStatus === AttendanceStatus.WORK_FROM_HOME ||
          att.attendanceStatus === AttendanceStatus.HOLIDAY) {
        presentDays++;
      } else if (att.attendanceStatus === AttendanceStatus.LATE) {
        lateDays++;
        presentDays++; // Late still counts as present usually, though we track lateDays separately
      } else if (att.attendanceStatus === AttendanceStatus.ABSENT) {
        absentDays++;
      }

      totalHours += att.workingHours || 0;
      overtimeHours += att.overtimeHours || 0;
    }

    // Leaves
    const startOfYear = new Date(year, 0, 1);
    const leaves = await leaveRepository.findOverlappingLeaves(employeeId, startDate, endDate);
    let leaveDays = 0;
    
    // Simplistic leave day calculation
    for (const leave of leaves) {
      // Calculate overlap with the current month
      const lStart = leave.startDate < startDate ? startDate : leave.startDate;
      const lEnd = leave.endDate > endDate ? endDate : leave.endDate;
      const days = Math.ceil((lEnd.getTime() - lStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      leaveDays += days;
    }

    const workingDaysInMonth = endDate.getDate(); // Simplistic: all days are working days, ideally we'd subtract weekends
    // Actually, calculate working days by excluding weekends
    let workDays = 0;
    for (let d = 1; d <= endDate.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // 0 is Sunday, 6 is Saturday
        workDays++;
      }
    }

    // Attendance Percentage (Present / Total Work Days)
    const expectedDays = workDays - leaveDays; 
    let attendancePercentage = 0;
    if (expectedDays > 0) {
      attendancePercentage = Number(((presentDays / expectedDays) * 100).toFixed(2));
      if (attendancePercentage > 100) attendancePercentage = 100;
    }

    return await attendanceSummaryRepository.upsert(
      employeeId,
      month,
      year,
      {
        presentDays,
        absentDays,
        leaveDays,
        lateDays,
        totalHours: Number(totalHours.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        attendancePercentage
      }
    );
  }

  async generateSummaryForDepartment(departmentId: string, month: number, year: number): Promise<void> {
    // 1. Get all employees in department
    const employees = await EmployeeModel.find({ departmentId, isDeleted: false });
    
    // 2. Generate summary for each
    for (const emp of employees) {
      await this.generateSummaryForEmployee(emp._id, month, year);
    }
  }

  async getSummary(employeeId: string, month: number, year: number): Promise<IAttendanceSummary | null> {
    return await attendanceSummaryRepository.findByEmployeeAndMonth(employeeId, month, year);
  }
}

export default new AttendanceSummaryService();
