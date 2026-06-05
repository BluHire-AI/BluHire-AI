import { Response } from 'express';
import candidatesService from './candidates.service';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '../../employee/dtos/common.dto';
import { CandidateQueryDTO } from '../repositories/candidate.repository';

export class CandidatesController {
  /**
   * Create Candidate
   * POST /api/v1/recruitment/candidates
   */
  async createCandidate(req: any, res: Response): Promise<void> {
    try {
      const { body, user } = req;
      const candidate = await candidatesService.createCandidate(body, user._id);

      res.status(201).json(
        createSuccessResponse(candidate, 'Candidate created successfully', 201)
      );
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to create candidate', undefined, 400)
      );
    }
  }

  /**
   * Get Candidate Details
   * GET /api/v1/recruitment/candidates/:id
   */
  async getCandidate(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidate = await candidatesService.getCandidateDetails(id);

      if (!candidate) {
        res.status(404).json(createErrorResponse('Candidate not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(candidate, 'Candidate retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to retrieve candidate', undefined, 400)
      );
    }
  }

  /**
   * Update Candidate Details
   * PATCH /api/v1/recruitment/candidates/:id
   */
  async updateCandidate(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { body, user } = req;
      const candidate = await candidatesService.updateCandidate(id, body, user._id);

      if (!candidate) {
        res.status(404).json(createErrorResponse('Candidate not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(candidate, 'Candidate updated successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to update candidate details', undefined, 400)
      );
    }
  }

  /**
   * Delete Candidate (Soft Delete)
   * DELETE /api/v1/recruitment/candidates/:id
   */
  async deleteCandidate(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidate = await candidatesService.deleteCandidate(id);

      if (!candidate) {
        res.status(404).json(createErrorResponse('Candidate not found', undefined, 404));
        return;
      }

      res.json(createSuccessResponse(null, 'Candidate deleted successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to delete candidate', undefined, 400)
      );
    }
  }

  /**
   * List Candidates
   * GET /api/v1/recruitment/candidates
   */
  async listCandidates(req: any, res: Response): Promise<void> {
    try {
      const query = req.query as CandidateQueryDTO;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await candidatesService.listCandidates(query, { page, limit });
      const paginatedResult = createPaginatedResponse(result.candidates, result.total, page, limit);

      res.json(createSuccessResponse(paginatedResult, 'Candidates retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(
        createErrorResponse(error.message || 'Failed to list candidates', undefined, 400)
      );
    }
  }
}

export default new CandidatesController();
