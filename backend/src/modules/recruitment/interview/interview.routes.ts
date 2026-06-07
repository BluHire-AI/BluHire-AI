import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import interviewController from './interview.controller';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import { SystemRoles } from '../../../models/roles';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

// ==========================================
// RECRUITER ROUTES (MANAGEMENT & REVIEW)
// ==========================================

const recruiterRoles = [
  EmployeeModuleRoles.MANAGEMENT_ADMIN,
  EmployeeModuleRoles.SENIOR_MANAGER,
  EmployeeModuleRoles.HR_RECRUITER
];

// Templates CRUD
router.post(
  '/templates',
  requireRole(...recruiterRoles),
  interviewController.createTemplate.bind(interviewController)
);
router.get(
  '/templates',
  requireRole(...recruiterRoles),
  interviewController.listTemplates.bind(interviewController)
);
router.get(
  '/templates/:id',
  requireRole(...recruiterRoles),
  interviewController.getTemplate.bind(interviewController)
);
router.patch(
  '/templates/:id',
  requireRole(...recruiterRoles),
  interviewController.updateTemplate.bind(interviewController)
);
router.delete(
  '/templates/:id',
  requireRole(...recruiterRoles),
  interviewController.deleteTemplate.bind(interviewController)
);

// Assignments List
router.get(
  '/assignments',
  requireRole(...recruiterRoles, SystemRoles.CANDIDATE as any),
  interviewController.listAssignments.bind(interviewController)
);
router.get(
  '/assignments/:id',
  requireRole(...recruiterRoles, SystemRoles.CANDIDATE as any),
  interviewController.getAssignment.bind(interviewController)
);

// Reports & Analytics
router.get(
  '/analytics',
  requireRole(...recruiterRoles),
  interviewController.getAnalytics.bind(interviewController)
);
router.get(
  '/report/:sessionId',
  requireRole(...recruiterRoles),
  interviewController.getReport.bind(interviewController)
);
router.get(
  '/audio/:filename',
  requireRole(...recruiterRoles),
  interviewController.streamAudioFile.bind(interviewController)
);

// ==========================================
// CANDIDATE INTERVIEW WORKFLOW ROUTES
// ==========================================

// Start session
router.post(
  '/session/start',
  interviewController.startSession.bind(interviewController)
);

// Submit response answer audio
router.post(
  '/session/submit-answer',
  upload.single('audio'),
  interviewController.submitAnswer.bind(interviewController)
);

// Integrity tracking update
router.post(
  '/session/integrity',
  interviewController.updateIntegrity.bind(interviewController)
);

export default router;
