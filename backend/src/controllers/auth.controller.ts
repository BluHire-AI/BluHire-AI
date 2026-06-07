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
      res.status(200).json({
        success: true,
        message: 'Password reset link generated',
        data: result,
      });
    } catch (error: any) {
      next(error);
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

  async verifyMagicToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;
      if (!token) {
        res.status(400).json({ success: false, message: 'Token is required' });
        return;
      }
      const assignment = await authService.verifyMagicToken(token as string);
      res.status(200).json({
        success: true,
        data: {
          assignmentId: assignment._id,
          candidate: assignment.candidateId,
          job: assignment.jobId
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Token verification failed' });
    }
  }

  async activateCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ success: false, message: 'Token and password are required' });
        return;
      }
      const result = await authService.activateCandidate(token, password);
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Activation failed' });
    }
  }
}

export const authController = new AuthController();
