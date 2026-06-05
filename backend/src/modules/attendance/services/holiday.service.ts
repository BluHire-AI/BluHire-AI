import { holidayRepository } from '../repositories';
import { CreateHolidayDto, UpdateHolidayDto, HolidayQueryDto } from '../dtos/holiday.dto';
import { IHoliday } from '../../../models/Holiday';
import ApiError from '../../../utils/ApiError';

export class HolidayService {
  async createHoliday(data: CreateHolidayDto): Promise<IHoliday> {
    // Check if a holiday already exists on this date
    const dateObj = new Date(data.date);
    const exists = await holidayRepository.isHoliday(dateObj);
    if (exists) {
      throw new ApiError(400, 'A holiday already exists on this date');
    }
    return await holidayRepository.create(data);
  }

  async getHolidayById(id: string): Promise<IHoliday> {
    const holiday = await holidayRepository.findById(id);
    if (!holiday) {
      throw new ApiError(404, 'Holiday not found');
    }
    return holiday;
  }

  async updateHoliday(id: string, data: UpdateHolidayDto): Promise<IHoliday> {
    const holiday = await holidayRepository.findById(id);
    if (!holiday) {
      throw new ApiError(404, 'Holiday not found');
    }
    
    if (data.date) {
      const dateObj = new Date(data.date);
      // Ensure we don't conflict with another holiday
      if (dateObj.getTime() !== holiday.date.getTime()) {
        const exists = await holidayRepository.isHoliday(dateObj);
        if (exists) {
          throw new ApiError(400, 'A holiday already exists on the new date');
        }
      }
    }

    return await holidayRepository.update(id, data) as IHoliday;
  }

  async deleteHoliday(id: string): Promise<void> {
    const holiday = await holidayRepository.findById(id);
    if (!holiday) {
      throw new ApiError(404, 'Holiday not found');
    }
    await holidayRepository.delete(id);
  }

  async getHolidays(query: HolidayQueryDto): Promise<{ records: IHoliday[]; total: number }> {
    return await holidayRepository.findWithPagination(query);
  }

  async checkIsHoliday(date: Date): Promise<boolean> {
    return await holidayRepository.isHoliday(date);
  }
}

export default new HolidayService();
