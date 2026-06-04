import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { RegisterDTO, LoginDTO } from '../dto/user.dto';

export class AuthService {
  async register(data: any) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await userRepository.create({
      ...data,
      passwordHash: hashedPassword,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    await userRepository.updateRefreshToken(user.id as string, refreshToken);

    return { user, accessToken, refreshToken };
  }

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await userRepository.updateRefreshToken(user.id as string, refreshToken);

    return { user, accessToken, refreshToken };
  }

  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, null);
  }

  async refreshTokens(token: string) {
    try {
      const decoded: any = verifyRefreshToken(token);
      const user = await userRepository.findById(decoded.id);

      if (!user || user.refreshToken !== token) {
        throw new Error('Invalid refresh token');
      }

      const { accessToken, refreshToken } = generateTokens(user);
      await userRepository.updateRefreshToken(user.id as string, refreshToken);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async changePassword(userId: string, data: any) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await comparePassword(data.oldPassword, user.passwordHash);
    if (!isMatch) throw new Error('Incorrect old password');

    const hashedPassword = await hashPassword(data.newPassword);
    await userRepository.updateById(userId, { passwordHash: hashedPassword } as any);
  }
}

export const authService = new AuthService();
