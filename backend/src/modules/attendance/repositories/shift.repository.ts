import ShiftModel, { IShift } from '../../../models/Shift';

export class ShiftRepository {
  async create(data: Partial<IShift>): Promise<IShift> {
    const shift = new ShiftModel(data);
    return await shift.save();
  }

  async findById(id: string): Promise<IShift | null> {
    return await ShiftModel.findById(id);
  }

  async findByName(name: string): Promise<IShift | null> {
    return await ShiftModel.findOne({ name });
  }

  async update(id: string, updateData: Partial<IShift>): Promise<IShift | null> {
    return await ShiftModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<void> {
    await ShiftModel.findByIdAndDelete(id);
  }

  async findAll(): Promise<IShift[]> {
    return await ShiftModel.find().sort({ createdAt: -1 });
  }
}

export default new ShiftRepository();
