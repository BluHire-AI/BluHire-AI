import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { analyticsService } from '../services/analytics.service';
import { getScopedAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';

export class AnalyticsController {
  async getOverview(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view team analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getOverview(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTopPerformers(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view talent analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getTopPerformers(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPromotionReady(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getPromotionReady(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSkillGaps(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view skill competency analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getSkillGaps(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getGoalCompletion(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view goal completion analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getGoalCompletion(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getManagerEffectiveness(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view manager effectiveness analytics' });
      }

      const scoped = await getScopedAccess(req.user);
      
      let departmentId: string | undefined = undefined;
      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        departmentId = req.query.departmentId as string;
      }

      const result = await analyticsService.getManagerEffectiveness(departmentId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
