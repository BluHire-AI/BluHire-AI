import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  getCandidateReport,
  getCandidateScorecard,
  updateCandidateStatus,
  getRankings,
  compareCandidates,
} from '../controllers/candidate.controller';

const router = Router();

// GET /api/v1/candidates
router.get('/', getCandidates);

// GET /api/v1/candidates/rankings
router.get('/rankings', getRankings);

// GET /api/v1/candidates/compare
router.get('/compare', compareCandidates);

// GET /api/v1/candidates/:id
router.get('/:id', getCandidateById);

// GET /api/v1/candidates/:id/report
router.get('/:id/report', getCandidateReport);

// GET /api/v1/candidates/:id/scorecard
router.get('/:id/scorecard', getCandidateScorecard);

// POST /api/v1/candidates/:id/status
router.post('/:id/status', updateCandidateStatus);

export default router;
