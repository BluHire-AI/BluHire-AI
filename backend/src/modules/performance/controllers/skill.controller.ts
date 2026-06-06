import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { performanceService } from '../services/performance.service';
import { assessSkillSchema } from '../validators/performance.validator';
import { getScopedAccess, hasWriteAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';
import Employee from '../../../models/Employee';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class SkillController {
  async assess(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to assess skills' });
      }

      const validatedData = assessSkillSchema.parse(req.body);
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(validatedData.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const assessment = await performanceService.assessSkill(validatedData, req.user._id);
      return res.status(201).json({ success: true, data: assessment });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, errors: (error as any).errors || (error as any).issues });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getList(req: AuthRequest, res: Response) {
    try {
      const scoped = await getScopedAccess(req.user);
      if (!scoped.allowed) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      }

      const filter = { ...scoped.filter };

      if (req.query.employeeId && req.user.role !== SystemRoles.EMPLOYEE) {
        filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
      }
      if (req.query.skillName) {
        filter.skillName = new RegExp(req.query.skillName as string, 'i');
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

      const assessments = await performanceService.getSkills(filter);
      return res.json({ success: true, data: assessments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInsights(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      const scoped = await getScopedAccess(req.user);
      if (!scoped.allowed) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      }

      // Check access permission on target employee
      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (employeeId !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view skill insights of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const insights = await performanceService.getSkillInsights(employeeId);
      return res.json({ success: true, data: insights });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const skillController = new SkillController();
