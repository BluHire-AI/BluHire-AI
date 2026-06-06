import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { performanceService } from '../services/performance.service';
import { createGoalSchema, updateGoalSchema } from '../validators/performance.validator';
import { getScopedAccess, hasWriteAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';
import Employee from '../../../models/Employee';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class GoalController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to create goals' });
      }

      const validatedData = createGoalSchema.parse(req.body);
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(validatedData.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const goal = await performanceService.createGoal(validatedData, req.user._id);
      return res.status(201).json({ success: true, data: goal });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, errors: (error as any).errors || (error as any).issues });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      if (req.user.role === SystemRoles.HR_RECRUITER) {
        return res.status(403).json({ success: false, message: 'Forbidden: Recruiter role is read-only' });
      }

      const validatedData = updateGoalSchema.parse(req.body);
      const id = req.params.id as string;

      const goal = await performanceService.getGoalById(id);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Employee goal not found' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (goal.employeeId._id.toString() !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot update goals of other employees' });
        }
        // Employees can only update progressPercentage and status
        const allowedUpdates = {
          progressPercentage: validatedData.progressPercentage,
          status: validatedData.status
        };
        const updatedGoal = await performanceService.updateGoal(id, allowedUpdates);
        return res.json({ success: true, data: updatedGoal });
      }

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(goal.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to an employee outside your department' });
        }
      }

      const updatedGoal = await performanceService.updateGoal(id, validatedData);
      return res.json({ success: true, data: updatedGoal });
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

      // Filter by status, priority, or employee if permitted
      if (req.query.employeeId && req.user.role !== SystemRoles.EMPLOYEE) {
        filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
      }
      if (req.query.status) {
        filter.status = req.query.status as string;
      }
      if (req.query.priority) {
        filter.priority = req.query.priority as string;
      }

      // If senior manager and specific department filter is requested, filter by manager's department
      if (req.user.role === SystemRoles.SENIOR_MANAGER && scoped.employeeIds) {
        filter.employeeId = { $in: scoped.employeeIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else if (req.query.departmentId && (req.user.role === SystemRoles.MANAGEMENT_ADMIN || req.user.role === SystemRoles.HR_RECRUITER)) {
        const employeeIds = await Employee.find({
          departmentId: req.query.departmentId as string,
          isDeleted: false
        }).distinct('_id');
        filter.employeeId = { $in: employeeIds };
      }

      const goals = await performanceService.getGoals(filter);
      return res.json({ success: true, data: goals });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const goal = await performanceService.getGoalById(id);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Employee goal not found' });
      }

      const scoped = await getScopedAccess(req.user);
      if (!scoped.allowed) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      }

      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (goal.employeeId._id.toString() !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view goals of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const emp = await Employee.findById(goal.employeeId);
        if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to another department' });
        }
      }

      return res.json({ success: true, data: goal });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to delete goals' });
      }

      const id = req.params.id as string;
      const goal = await performanceService.getGoalById(id);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Employee goal not found' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(goal.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Goal belongs to an employee outside your department' });
        }
      }

      await performanceService.deleteGoal(id);
      return res.json({ success: true, message: 'Employee goal deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const goalController = new GoalController();
