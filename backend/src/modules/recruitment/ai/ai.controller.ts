import { Response } from 'express';
import ApplicationModel from '../../../models/Application';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';
import mongoose from 'mongoose';

export class AIController {
  /**
   * Queue single application screening
   * POST /api/v1/ai/screen
   */
  async screen(req: any, res: Response): Promise<void> {
    try {
      const { applicationId } = req.body;
      if (!applicationId) {
        res.status(400).json(createErrorResponse('applicationId is required'));
        return;
      }

      const app = await ApplicationModel.findOneAndUpdate(
        { _id: applicationId, isDeleted: false },
        { screeningStatus: 'PENDING', updatedAt: new Date() },
        { returnDocument: 'after' }
      );

      if (!app) {
        res.status(404).json(createErrorResponse('Application record not found'));
        return;
      }

      res.json(createSuccessResponse(null, 'Application successfully queued for AI screening.'));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(error.message || 'Failed to queue screening'));
    }
  }

  /**
   * Queue bulk application screening
   * POST /api/v1/ai/screen/bulk
   */
  async screenBulk(req: any, res: Response): Promise<void> {
    try {
      const { applicationIds, jobId } = req.body;
      let filter: any = { isDeleted: false };

      if (applicationIds && Array.isArray(applicationIds)) {
        filter._id = { $in: applicationIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else if (jobId) {
        filter.jobId = new mongoose.Types.ObjectId(jobId);
      } else {
        res.status(400).json(createErrorResponse('Either applicationIds or jobId must be provided'));
        return;
      }

      const result = await ApplicationModel.updateMany(
        filter,
        { $set: { screeningStatus: 'PENDING', updatedAt: new Date() } }
      );

      res.json(createSuccessResponse(
        { modifiedCount: result.modifiedCount },
        `Queued ${result.modifiedCount} applications for AI screening.`
      ));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(error.message || 'Failed to queue bulk screening'));
    }
  }

  /**
   * Get screening results for an application
   * GET /api/v1/ai/screen/:applicationId
   */
  async getScreenResult(req: any, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      const app = await ApplicationModel.findOne({ _id: applicationId, isDeleted: false })
        .populate('candidateId')
        .populate('jobId');

      if (!app) {
        res.status(404).json(createErrorResponse('Application record not found'));
        return;
      }

      res.json(createSuccessResponse({
        applicationId: app._id,
        screeningStatus: app.screeningStatus,
        aiScore: app.aiScore,
        aiRecommendation: app.aiRecommendation,
        matchingSkills: app.matchingSkills,
        missingSkills: app.missingSkills,
        screeningSummary: app.screeningSummary,
        notes: app.notes
      }));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve screening details'));
    }
  }

  /**
   * Get AI recruitment analytics
   * GET /api/v1/ai/analytics
   */
  async getAnalytics(req: any, res: Response): Promise<void> {
    try {
      // 1. Calculate Average AI Score
      const avgResult = await ApplicationModel.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED', aiScore: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: '$aiScore' } } }
      ]);
      const averageAiScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : 0;

      // 2. Count recommendations
      const recResult = await ApplicationModel.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
        { $group: { _id: '$aiRecommendation', count: { $sum: 1 } } }
      ]);

      const counts: Record<string, number> = {
        'Strong Hire': 0,
        'Hire': 0,
        'Needs Review': 0,
        'Reject': 0
      };
      recResult.forEach(item => {
        if (item._id && counts[item._id] !== undefined) {
          counts[item._id] = item.count;
        }
      });

      // 3. Top matching and missing skills
      const matchingSkillsResult = await ApplicationModel.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
        { $unwind: '$matchingSkills' },
        { $group: { _id: '$matchingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const missingSkillsResult = await ApplicationModel.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED' } },
        { $unwind: '$missingSkills' },
        { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.json(createSuccessResponse({
        averageAiScore,
        strongHireCount: counts['Strong Hire'],
        hireCount: counts['Hire'],
        needsReviewCount: counts['Needs Review'],
        rejectCount: counts['Reject'],
        topMatchingSkills: matchingSkillsResult.map(s => ({ skill: s._id, count: s.count })),
        topMissingSkills: missingSkillsResult.map(s => ({ skill: s._id, count: s.count }))
      }));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve AI analytics'));
    }
  }

  /**
   * Health check for AI service
   * GET /api/v1/ai/health
   */
  async healthCheck(req: any, res: Response): Promise<void> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    try {
      const response = await fetch(`${aiServiceUrl}/health`);
      if (!response.ok) {
        throw new Error(`AI Service returned status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(200).json({
        status: "unhealthy",
        openRouter: false,
        model: "Unknown",
        error: error.message || "AI Service Offline"
      });
    }
  }
}

export default new AIController();
