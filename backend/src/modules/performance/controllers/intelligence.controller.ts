import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { getScopedAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';
import Employee from '../../../models/Employee';
import { performanceTrendService } from '../services/trend.service';
import { performanceRiskService } from '../services/risk.service';
import { performanceLearningService } from '../services/learning.service';
import { performanceCalibrationService } from '../services/calibration.service';
import { performanceSuccessionService } from '../services/succession.service';
import mongoose from 'mongoose';

export class IntelligenceController {
  async getTrends(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (employeeId !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view trends of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const emp = await Employee.findById(employeeId);
        if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const trend = await performanceTrendService.getEmployeeTrend(employeeId);
      return res.json({ success: true, data: trend });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRisk(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot access performance risk reports' });
      }

      const scoped = await getScopedAccess(req.user);
      const filter: any = {};

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        filter.departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        filter.departmentId = req.query.departmentId as string;
      }

      const risks = await performanceRiskService.getHighRiskEmployees(filter);
      return res.json({ success: true, data: risks });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLearningPlan(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (employeeId !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view learning plans of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const emp = await Employee.findById(employeeId);
        if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const plan = await performanceLearningService.getLearningPlan(employeeId);
      return res.json({ success: true, data: plan });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCalibration(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view calibration distributions' });
      }

      const scoped = await getScopedAccess(req.user);
      const filter: any = {};

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        filter.departmentId = scoped.departmentId;
      } else if (req.query.departmentId) {
        filter.departmentId = req.query.departmentId as string;
      }

      const calibration = await performanceCalibrationService.getCalibration(filter);
      return res.json({ success: true, data: calibration });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSuccession(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view succession planning maps' });
      }

      const position = req.query.position as string;
      const scoped = await getScopedAccess(req.user);

      if (position) {
        const plan = await performanceSuccessionService.getSuccessionPlan(position);
        
        // Senior manager checks if they own the position's department
        if (req.user.role === SystemRoles.SENIOR_MANAGER && plan && plan.currentEmployee) {
          const emp = await Employee.findById(plan.currentEmployee._id);
          if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
            return res.status(403).json({ success: false, message: 'Forbidden: Critical position current employee is not in your department' });
          }
        }

        return res.json({ success: true, data: plan });
      }

      let plans = await performanceSuccessionService.getAllPlans();

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        plans = plans.filter((p: any) => {
          if (p.currentEmployee && p.currentEmployee.departmentId) {
            return p.currentEmployee.departmentId.toString() === scoped.departmentId;
          }
          return false;
        });
      }

      return res.json({ success: true, data: plans });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const intelligenceController = new IntelligenceController();
