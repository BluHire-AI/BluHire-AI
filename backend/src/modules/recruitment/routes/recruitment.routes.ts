import { Router } from 'express';
import jobsController from '../jobs/jobs.controller';
import candidatesController from '../candidates/candidates.controller';
import applicationsController from '../applications/applications.controller';
import { uploadResume } from '../middlewares/upload.middleware';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';

// 1. Unauthenticated Public Router (Careers Portal)
export const publicRecruitmentRouter = Router();

publicRecruitmentRouter.get(
  '/jobs',
  jobsController.listPublicJobs.bind(jobsController)
);
publicRecruitmentRouter.get(
  '/jobs/:id',
  jobsController.getJob.bind(jobsController)
);
publicRecruitmentRouter.post(
  '/apply',
  uploadResume.single('resume'),
  applicationsController.applyToJob.bind(applicationsController)
);

// 2. Authenticated Recruiter Router (Dashboard)
export const adminRecruitmentRouter = Router();

// Apply Role restriction middleware for Recruiters and Admins
adminRecruitmentRouter.use(
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN, EmployeeModuleRoles.HR_RECRUITER)
);

// Jobs CRUD
adminRecruitmentRouter.post(
  '/jobs',
  jobsController.createJob.bind(jobsController)
);
adminRecruitmentRouter.get(
  '/jobs',
  jobsController.listJobs.bind(jobsController)
);
adminRecruitmentRouter.get(
  '/jobs/:id',
  jobsController.getJob.bind(jobsController)
);
adminRecruitmentRouter.patch(
  '/jobs/:id',
  jobsController.updateJob.bind(jobsController)
);
adminRecruitmentRouter.delete(
  '/jobs/:id',
  jobsController.deleteJob.bind(jobsController)
);

// Candidates Management
adminRecruitmentRouter.get(
  '/candidates',
  candidatesController.listCandidates.bind(candidatesController)
);
adminRecruitmentRouter.get(
  '/candidates/:id',
  candidatesController.getCandidate.bind(candidatesController)
);
adminRecruitmentRouter.patch(
  '/candidates/:id',
  candidatesController.updateCandidate.bind(candidatesController)
);
adminRecruitmentRouter.delete(
  '/candidates/:id',
  candidatesController.deleteCandidate.bind(candidatesController)
);

// Applications Management
adminRecruitmentRouter.get(
  '/applications',
  applicationsController.listApplications.bind(applicationsController)
);
adminRecruitmentRouter.patch(
  '/applications/:id/stage',
  applicationsController.moveStage.bind(applicationsController)
);

// Pipeline, Analytics & Activities
adminRecruitmentRouter.get(
  '/pipeline',
  applicationsController.getPipeline.bind(applicationsController)
);
adminRecruitmentRouter.get(
  '/analytics',
  applicationsController.getAnalytics.bind(applicationsController)
);
adminRecruitmentRouter.get(
  '/activities',
  applicationsController.getActivities.bind(applicationsController)
);

// Secure Resume Downloads
adminRecruitmentRouter.get(
  '/resumes/download/:filename',
  applicationsController.downloadResume.bind(applicationsController)
);
