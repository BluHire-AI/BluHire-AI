import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { performanceService } from '../services/performance.service';
import { createReviewSchema, updateReviewSchema } from '../validators/performance.validator';
import { getScopedAccess, hasWriteAccess } from './rbac.helper';
import { SystemRoles } from '../../../models/roles';
import Employee from '../../../models/Employee';
import { ZodError } from 'zod';

export class ReviewController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to create reviews' });
      }

      const validatedData = createReviewSchema.parse(req.body);
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(validatedData.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee is not within your department' });
        }
      }

      const review = await performanceService.createReview(validatedData, req.user._id);
      return res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, errors: (error as any).errors || (error as any).issues });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to update reviews' });
      }

      const validatedData = updateReviewSchema.parse(req.body);
      const id = req.params.id as string;

      const review = await performanceService.getReviewById(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Performance review not found' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(review.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to an employee outside your department' });
        }
      }

      const updatedReview = await performanceService.updateReview(id, validatedData);
      return res.json({ success: true, data: updatedReview });
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
        return res.status(403).json({ success: false, message: 'Forbidden: User context is invalid' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filter = { ...scoped.filter };

      // Apply query filters if permitted
      if (req.query.employeeId && req.user.role !== SystemRoles.EMPLOYEE) {
        filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
      }
      if (req.query.reviewPeriod) {
        filter.reviewPeriod = req.query.reviewPeriod as string;
      }
      if (req.query.reviewType) {
        filter.reviewType = req.query.reviewType as string;
      }
      if (req.query.status) {
        filter.status = req.query.status as string;
      }

      // If senior manager and specific department filter is requested, filter by manager's department
      if (req.user.role === SystemRoles.SENIOR_MANAGER && scoped.employeeIds) {
        // Enforce the department employee ID list
        filter.employeeId = { $in: scoped.employeeIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else if (req.query.departmentId && (req.user.role === SystemRoles.MANAGEMENT_ADMIN || req.user.role === SystemRoles.HR_RECRUITER)) {
        // Find employees of the specified department
        const employeeIds = await Employee.find({
          departmentId: req.query.departmentId as string,
          isDeleted: false
        }).distinct('_id');
        filter.employeeId = { $in: employeeIds };
      }

      const result = await performanceService.getReviews(filter, page, limit);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const review = await performanceService.getReviewById(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Performance review not found' });
      }

      const scoped = await getScopedAccess(req.user);
      if (!scoped.allowed) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      }

      // Validate resource access scope
      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (review.employeeId._id.toString() !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view reviews of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const emp = await Employee.findById(review.employeeId);
        if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to another department' });
        }
      }

      return res.json({ success: true, data: review });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!hasWriteAccess(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to delete reviews' });
      }

      const id = req.params.id as string;
      const review = await performanceService.getReviewById(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Performance review not found' });
      }

      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const targetEmployee = await Employee.findById(review.employeeId);
        if (!targetEmployee || targetEmployee.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Review belongs to an employee outside your department' });
        }
      }

      await performanceService.deleteReview(id);
      return res.json({ success: true, message: 'Performance review deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getComparison(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      const scoped = await getScopedAccess(req.user);

      if (req.user.role === SystemRoles.EMPLOYEE) {
        if (employeeId !== scoped.employeeId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot view comparison data of other employees' });
        }
      } else if (req.user.role === SystemRoles.SENIOR_MANAGER) {
        const emp = await Employee.findById(employeeId);
        if (!emp || emp.departmentId.toString() !== scoped.departmentId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Employee belongs to another department' });
        }
      }

      const reviews = await PerformanceReview.find({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        status: ReviewStatus.SUBMITTED
      }).sort({ createdAt: 1 });

      const periodMap = new Map<string, { self?: any; manager?: any }>();
      for (const r of reviews) {
        const period = r.reviewPeriod;
        if (!periodMap.has(period)) {
          periodMap.set(period, {});
        }
        const entry = periodMap.get(period)!;
        if (r.reviewSource === 'SELF') {
          entry.self = r;
        } else if (r.reviewSource === 'MANAGER') {
          entry.manager = r;
        }
      }

      const comparisons = [];
      for (const [period, data] of periodMap.entries()) {
        comparisons.push({
          reviewPeriod: period,
          self: data.self ? {
            overallScore: data.self.overallScore,
            communicationScore: data.self.communicationScore,
            technicalScore: data.self.technicalScore,
            leadershipScore: data.self.leadershipScore,
            productivityScore: data.self.productivityScore,
            teamworkScore: data.self.teamworkScore,
            comments: data.self.comments
          } : null,
          manager: data.manager ? {
            overallScore: data.manager.overallScore,
            communicationScore: data.manager.communicationScore,
            technicalScore: data.manager.technicalScore,
            leadershipScore: data.manager.leadershipScore,
            productivityScore: data.manager.productivityScore,
            teamworkScore: data.manager.teamworkScore,
            comments: data.manager.comments
          } : null,
          gap: (data.manager && data.self) ? (data.manager.overallScore - data.self.overallScore) : 0
        });
      }

      return res.json({ success: true, data: comparisons });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

import mongoose from 'mongoose';
import { PerformanceReview, ReviewStatus } from '../../../models/PerformanceReview';
export const reviewController = new ReviewController();

