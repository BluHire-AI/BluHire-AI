import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt.util';
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

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { success: true };
    }

    const resetToken = generateResetToken(user);
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('------------------------------------');
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('------------------------------------');
    
    return { success: true, resetToken, resetLink };
  }

  async resetPassword(data: any) {
    try {
      const decoded = verifyResetToken(data.token);
      const user = await userRepository.findById(decoded.id);
      if (!user) throw new Error('User not found');

      const hashedPassword = await hashPassword(data.newPassword);
      await userRepository.updateById(user.id as string, { passwordHash: hashedPassword } as any);
      await userRepository.updateRefreshToken(user.id as string, null);
    } catch (error: any) {
      throw new Error(error.message || 'Invalid or expired reset token');
    }
  }
}

export const authService = new AuthService();
