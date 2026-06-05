import { shiftRepository } from '../repositories';
import { CreateShiftDto, UpdateShiftDto } from '../dtos/shift.dto';
import { IShift } from '../../../models/Shift';
import ApiError from '../../../utils/ApiError';

export class ShiftService {
  async createShift(data: CreateShiftDto): Promise<IShift> {
    const existing = await shiftRepository.findByName(data.name);
    if (existing) {
      throw new ApiError(400, `Shift with name ${data.name} already exists`);
    }
    return await shiftRepository.create(data);
  }

  async getShiftById(id: string): Promise<IShift> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }
    return shift;
  }

  async updateShift(id: string, data: UpdateShiftDto): Promise<IShift> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }
    
    if (data.name && data.name !== shift.name) {
      const existing = await shiftRepository.findByName(data.name);
      if (existing) {
        throw new ApiError(400, `Shift with name ${data.name} already exists`);
      }
    }

    return await shiftRepository.update(id, data) as IShift;
  }

  async deleteShift(id: string): Promise<void> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }
    // TODO: check if any employee is assigned to this shift before deleting
    await shiftRepository.delete(id);
  }

  async getAllShifts(): Promise<IShift[]> {
    return await shiftRepository.findAll();
  }
}

export default new ShiftService();
