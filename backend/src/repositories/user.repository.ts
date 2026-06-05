import { User, IUser } from '../models/User';
import { UserUpdateDTO, RegisterDTO } from '../dto/user.dto';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async updateById(id: string, updateData: UserUpdateDTO): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken });
  }

  async findByRefreshToken(refreshToken: string): Promise<IUser | null> {
    return await User.findOne({ refreshToken });
  }

  async listUsers(page: number, limit: number, filter: any = {}): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const users = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    return { users, total };
  }

  async softDelete(id: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
  }
}

export const userRepository = new UserRepository();
