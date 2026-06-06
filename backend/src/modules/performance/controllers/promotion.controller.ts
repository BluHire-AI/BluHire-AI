import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { performanceService } from '../services/performance.service';
import { getScopedAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';
import Employee from '../../../models/Employee';
import mongoose from 'mongoose';

export class PromotionController {
  async evaluate(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      
      if (req.user.role === SystemRoles.EMPLOYEE || req.user.role === SystemRoles.HR_RECRUITER) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to evaluate promotion readiness' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const assessment = await performanceService.evaluatePromotion(employeeId);
      return res.json({ success: true, data: assessment });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getList(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion assessment lists' });
      }

      const scoped = await getScopedAccess(req.user);
      const filter = { ...scoped.filter };

      if (req.query.employeeId) {
        filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
      }

      // Senior manager scoping filter
      if (req.user.role === SystemRoles.SENIOR_MANAGER && scoped.employeeIds) {
        filter.employeeId = { $in: scoped.employeeIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else if (req.query.departmentId && (req.user.role === SystemRoles.MANAGEMENT_ADMIN || req.user.role === SystemRoles.HR_RECRUITER)) {
        const employeeIds = await Employee.find({
          departmentId: req.query.departmentId as string,
          isDeleted: false
        }).distinct('_id');
        filter.employeeId = { $in: employeeIds };
      }

      const assessments = await performanceService.getPromotionAssessments(filter);
      return res.json({ success: true, data: assessments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByEmployeeId(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;

      if (req.user.role === SystemRoles.EMPLOYEE) {
        return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot view promotion assessment reports' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const assessment = await performanceService.getPromotionAssessmentByEmployee(employeeId);
      if (!assessment) {
        return res.status(404).json({ success: false, message: 'No promotion assessment found for this employee' });
      }

      return res.json({ success: true, data: assessment });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const promotionController = new PromotionController();
