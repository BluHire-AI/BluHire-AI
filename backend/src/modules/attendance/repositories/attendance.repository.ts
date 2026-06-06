import AttendanceModel, { IAttendance } from '../../../models/Attendance';
import { AttendanceQueryDto } from '../dtos/attendance.dto';

export class AttendanceRepository {
  async create(data: Partial<IAttendance>): Promise<IAttendance> {
    const attendance = new AttendanceModel(data);
    return await attendance.save();
  }

  async findById(id: string): Promise<IAttendance | null> {
    return await AttendanceModel.findById(id).populate('employeeId', 'firstName lastName employeeCode');
  }

  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<IAttendance | null> {
    // Standardize date to beginning of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await AttendanceModel.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('employeeId', 'firstName lastName employeeCode');
  }

  async update(id: string, updateData: Partial<IAttendance>): Promise<IAttendance | null> {
    return await AttendanceModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName employeeCode');
  }

  async findWithPagination(query: AttendanceQueryDto): Promise<{ records: IAttendance[]; total: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.attendanceStatus = query.status;
    
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    const [records, total] = await Promise.all([
      AttendanceModel.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'firstName lastName employeeCode departmentId shiftId'),
      AttendanceModel.countDocuments(filter),
    ]);

    return { records, total };
  }

  async findByDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<IAttendance[]> {
    return await AttendanceModel.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
  }

  async getCompanyAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const result = await AttendanceModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalLate: {
            $sum: { $cond: [{ $eq: ["$attendanceStatus", "LATE"] }, 1, 0] }
          },
          totalPresent: {
            $sum: {
              $cond: [
                { $in: ["$attendanceStatus", ["PRESENT", "LATE", "HALF_DAY"]] },
                1,
                0
              ]
            }
          },
          totalOvertimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
          totalWorkingHours: { $sum: { $ifNull: ["$workingHours", 0] } }
        }
      }
    ]);

    if (result.length > 0) {
      return result[0];
    }

    return {
      totalRecords: 0,
      totalLate: 0,
      totalPresent: 0,
      totalOvertimeHours: 0,
      totalWorkingHours: 0
    };
  }
}

export default new AttendanceRepository();
