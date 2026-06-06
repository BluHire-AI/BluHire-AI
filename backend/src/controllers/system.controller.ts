import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email.service';

export class SystemController {
  async getEmailHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await emailService.getHealthStatus();
      res.status(health.status === 'OK' ? 200 : 207).json({
        success: true,
        data: health
      });
    } catch (error) {
      next(error);
    }
  }
}

export const systemController = new SystemController();
