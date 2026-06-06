import AttendanceSummaryModel, { IAttendanceSummary } from '../../../models/AttendanceSummary';

export class AttendanceSummaryRepository {
  async upsert(
    employeeId: string, 
    month: number, 
    year: number, 
    updateData: Partial<IAttendanceSummary>
  ): Promise<IAttendanceSummary> {
    return await AttendanceSummaryModel.findOneAndUpdate(
      { employeeId, month, year },
      { 
        $set: { ...updateData, generatedAt: new Date() }
      },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async findByEmployeeAndMonth(employeeId: string, month: number, year: number): Promise<IAttendanceSummary | null> {
    return await AttendanceSummaryModel.findOne({ employeeId, month, year })
      .populate('employeeId', 'firstName lastName employeeCode departmentId');
  }

  async findByDepartmentAndMonth(departmentId: string, month: number, year: number): Promise<IAttendanceSummary[]> {
    // We need to join with employees collection to filter by department
    // Since Mongoose population doesn't filter the root document based on populated fields easily in find(),
    // we should use aggregate or find with employee IDs
    
    // For simplicity, we assume the caller will fetch employeeIds in the department first and pass them
    throw new Error('Method not fully implemented - requires employee list or aggregate query');
  }

  async findByEmployeesAndMonth(employeeIds: string[], month: number, year: number): Promise<IAttendanceSummary[]> {
    return await AttendanceSummaryModel.find({
      employeeId: { $in: employeeIds },
      month,
      year
    }).populate('employeeId', 'firstName lastName employeeCode departmentId');
  }
}

export default new AttendanceSummaryRepository();
