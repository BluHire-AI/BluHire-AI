import { userRepository } from '../repositories/user.repository';
import { UserUpdateDTO } from '../dto/user.dto';

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: UserUpdateDTO) {
    const user = await userRepository.updateById(userId, updateData);
    if (!user) throw new Error('User not found');
    return user;
  }

  async listUsers(page: number, limit: number, filterParams: any) {
    return await userRepository.listUsers(page, limit, filterParams);
  }

  async softDeleteUser(userId: string) {
    return await userRepository.softDelete(userId);
  }
}

export const userService = new UserService();
