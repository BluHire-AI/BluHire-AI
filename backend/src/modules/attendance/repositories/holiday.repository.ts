import HolidayModel, { IHoliday } from '../../../models/Holiday';
import { HolidayQueryDto } from '../dtos/holiday.dto';

export class HolidayRepository {
  async create(data: Partial<IHoliday>): Promise<IHoliday> {
    const holiday = new HolidayModel(data);
    return await holiday.save();
  }

  async findById(id: string): Promise<IHoliday | null> {
    return await HolidayModel.findById(id);
  }

  async update(id: string, updateData: Partial<IHoliday>): Promise<IHoliday | null> {
    return await HolidayModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<void> {
    await HolidayModel.findByIdAndDelete(id);
  }

  async findWithPagination(query: HolidayQueryDto): Promise<{ records: IHoliday[]; total: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.year) {
      const startDate = new Date(query.year, 0, 1);
      const endDate = new Date(query.year, 11, 31, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
      
      if (query.month) {
        // month is 1-indexed in query, 0-indexed in Date
        const monthStart = new Date(query.year, query.month - 1, 1);
        const monthEnd = new Date(query.year, query.month, 0, 23, 59, 59); // last day of month
        filter.date = { $gte: monthStart, $lte: monthEnd };
      }
    }

    const [records, total] = await Promise.all([
      HolidayModel.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      HolidayModel.countDocuments(filter),
    ]);

    return { records, total };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<IHoliday[]> {
    return await HolidayModel.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
  }

  async isHoliday(date: Date): Promise<boolean> {
    // Check if the specific date is a holiday
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await HolidayModel.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    return count > 0;
  }
}

export default new HolidayRepository();
