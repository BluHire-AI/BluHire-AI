import express from 'express';
import { getExecutiveAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { SystemRoles } from '../models/roles';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(authenticate);

// Phase 8: Executive Analytics - Restricted to MANAGEMENT_ADMIN and SENIOR_MANAGER
router.get(
  '/executive',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER]),
  getExecutiveAnalytics
);

export default router;
