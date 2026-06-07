import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import interviewService from './interview.service';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';

export class InterviewController {
  // --- TEMPLATES ---
  async createTemplate(req: any, res: Response): Promise<void> {
    try {
      const template = await interviewService.createTemplate(req.body, req.user._id);
      res.status(201).json(createSuccessResponse(template, 'Interview template created successfully', 201));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to create template'));
    }
  }

  async listTemplates(req: any, res: Response): Promise<void> {
    try {
      const { department, jobRole } = req.query;
      const filter: any = {};
      if (department) filter.department = department;
      if (jobRole) filter.jobRole = jobRole;

      const templates = await interviewService.getTemplates(filter);
      res.json(createSuccessResponse(templates, 'Templates retrieved successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to list templates'));
    }
  }

  async getTemplate(req: any, res: Response): Promise<void> {
    try {
      const template = await interviewService.getTemplateById(req.params.id);
      res.json(createSuccessResponse(template, 'Template retrieved successfully'));
    } catch (err: any) {
      res.status(404).json(createErrorResponse(err.message || 'Template not found'));
    }
  }

  async updateTemplate(req: any, res: Response): Promise<void> {
    try {
      const template = await interviewService.updateTemplate(req.params.id, req.body, req.user._id);
      res.json(createSuccessResponse(template, 'Template updated successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to update template'));
    }
  }

  async deleteTemplate(req: any, res: Response): Promise<void> {
    try {
      await interviewService.deleteTemplate(req.params.id);
      res.json(createSuccessResponse(null, 'Template archived successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to delete template'));
    }
  }

  // --- ASSIGNMENTS ---
  async listAssignments(req: any, res: Response): Promise<void> {
    try {
      const { jobId, status, candidateId } = req.query;
      const filter: any = {};
      if (jobId && jobId !== 'ALL') filter.jobId = jobId;
      if (status && status !== 'ALL') filter.status = status;
      if (candidateId) filter.candidateId = candidateId;

      // Restrict candidate's scope to their own assignments
      if (req.user.role === 'CANDIDATE') {
        const Candidate = mongoose.model('Candidate');
        const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
        if (!candidate) {
          res.json(createSuccessResponse([], 'Assignments retrieved successfully'));
          return;
        }
        filter.candidateId = candidate._id;
      } else if (req.user.role === 'HR_RECRUITER') {
        // Restrict recruiter's scope if they are HR_RECRUITER
        filter.recruiterId = req.user._id;
      }

      const assignments = await interviewService.getAssignments(filter);
      res.json(createSuccessResponse(assignments, 'Assignments retrieved successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to list assignments'));
    }
  }

  async getAssignment(req: any, res: Response): Promise<void> {
    try {
      const assignment = await interviewService.getAssignmentById(req.params.id);
      if (!assignment) {
        res.status(404).json(createErrorResponse('Assignment not found', undefined, 404));
        return;
      }

      // Restrict candidate's access to their own assignment
      if (req.user.role === 'CANDIDATE') {
        const Candidate = mongoose.model('Candidate');
        const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
        const assignmentCandidateId = assignment.candidateId?._id?.toString() || assignment.candidateId?.toString();
        if (!candidate || assignmentCandidateId !== candidate._id.toString()) {
          res.status(403).json(createErrorResponse('Forbidden: Insufficient permissions', undefined, 403));
          return;
        }
      }

      res.json(createSuccessResponse(assignment, 'Assignment retrieved successfully'));
    } catch (err: any) {
      res.status(404).json(createErrorResponse(err.message || 'Assignment not found'));
    }
  }

  // --- CANDIDATE INTERVIEWS ---
  async startSession(req: any, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.body;
      let candidateId = req.user._id;

      if (!assignmentId) {
        res.status(400).json(createErrorResponse('assignmentId is required'));
        return;
      }

      if (req.user.role === 'CANDIDATE') {
        const Candidate = mongoose.model('Candidate');
        const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
        if (!candidate) {
          res.status(403).json(createErrorResponse('Forbidden: No candidate profile found', undefined, 403));
          return;
        }
        candidateId = candidate._id.toString();
      }

      const result = await interviewService.startSession(assignmentId, candidateId);
      res.json(createSuccessResponse(result, 'Session started successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to start interview session'));
    }
  }

  async submitAnswer(req: any, res: Response): Promise<void> {
    try {
      const { sessionId, questionId } = req.body;
      const file = req.file;

      if (!sessionId || !questionId || !file) {
        res.status(400).json(createErrorResponse('sessionId, questionId, and audio file are required'));
        return;
      }

      const response = await interviewService.submitAnswer(sessionId, questionId, file);
      res.json(createSuccessResponse(response, 'Answer uploaded successfully. Processing started.'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to submit answer'));
    }
  }

  async updateIntegrity(req: any, res: Response): Promise<void> {
    try {
      const { sessionId, eventType } = req.body; // eventType: tab-switch, fullscreen-exit, disconnect
      if (!sessionId || !eventType) {
        res.status(400).json(createErrorResponse('sessionId and eventType are required'));
        return;
      }

      const session = await interviewService.updateIntegrity(sessionId, eventType);
      res.json(createSuccessResponse(session, 'Integrity metric updated successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to update integrity log'));
    }
  }

  // --- REPORT & ANALYTICS VIEWER ---
  async getReport(req: any, res: Response): Promise<void> {
    try {
      const report = await interviewService.getReport(req.params.sessionId);
      res.json(createSuccessResponse(report, 'Evaluation report retrieved successfully'));
    } catch (err: any) {
      res.status(404).json(createErrorResponse(err.message || 'Report not compiled or not found'));
    }
  }

  async getAnalytics(req: any, res: Response): Promise<void> {
    try {
      const { jobId } = req.query;
      const filter: any = {};
      if (jobId && jobId !== 'ALL') filter.jobId = jobId;

      if (req.user.role === 'HR_RECRUITER') {
        filter.recruiterId = req.user._id;
      }

      const analytics = await interviewService.getAnalytics(filter);
      res.json(createSuccessResponse(analytics, 'Recruitment analytics compiled successfully'));
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to compile analytics'));
    }
  }

  // --- AUDIO SERVING ---
  async streamAudioFile(req: any, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'interviews', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json(createErrorResponse('Audio file not found', undefined, 404));
        return;
      }

      res.setHeader('Content-Type', 'audio/webm');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err: any) {
      res.status(400).json(createErrorResponse(err.message || 'Failed to stream audio file'));
    }
  }
}

export default new InterviewController();
