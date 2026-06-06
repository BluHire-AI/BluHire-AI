import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  async logout(req: Request | any, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user.id);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshTokens(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid refresh token') {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  async changePassword(req: Request | any, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user.id, req.body);
      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async verifyResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyResetOtp(email, otp);
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }
}

export const authController = new AuthController();
