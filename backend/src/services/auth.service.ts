import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt.util';
import { RegisterDTO, LoginDTO } from '../dto/user.dto';
import { emailService } from './email.service';

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
    await userRepository.updateById(userId, { passwordHash: hashedPassword, mustChangePassword: false } as any);
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Generic response to prevent enumeration
      return { success: true, message: 'If an account exists, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hashPassword(otp);
    
    // Set expiry to 10 mins from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await userRepository.updateById(user.id as string, {
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpires: expires,
      passwordResetAttempts: 0
    } as any);

    await emailService.sendPasswordResetOTP(email, otp);
    
    return { success: true, message: 'If an account exists, an OTP has been sent.' };
  }

  async verifyResetOtp(email: string, otp: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpires) {
      throw new Error('Invalid or expired OTP');
    }

    if (user.passwordResetAttempts && user.passwordResetAttempts >= 5) {
      throw new Error('Too many verification attempts. Please request a new OTP.');
    }

    if (new Date() > user.passwordResetOtpExpires) {
      throw new Error('OTP has expired');
    }

    const isMatch = await comparePassword(otp, user.passwordResetOtp);
    if (!isMatch) {
      await userRepository.updateById(user.id as string, {
        passwordResetAttempts: (user.passwordResetAttempts || 0) + 1
      } as any);
      throw new Error('Invalid OTP');
    }

    // OTP verified successfully. Generate temporary reset token.
    const tempResetToken = generateResetToken(user);
    
    // Clear OTP data
    await userRepository.updateById(user.id as string, {
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
      passwordResetAttempts: 0
    } as any);

    return { tempResetToken };
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
