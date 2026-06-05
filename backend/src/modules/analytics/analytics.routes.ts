import { Router } from 'express';
import analyticsController from './analytics.controller';
import { requireRole, EmployeeModuleRoles } from '../employee/middlewares/rbac.middleware';
import { validateQuery } from '../employee/middlewares/validate.middleware';
import {
  analyticsQuerySchema,
  analyticsPaginationSchema,
  exportQuerySchema,
} from './analytics.validator';

const router = Router();

// Enforce role-based access control (RBAC) at the routing level
router.use(
  requireRole(
    EmployeeModuleRoles.MANAGEMENT_ADMIN,
    EmployeeModuleRoles.SENIOR_MANAGER,
    EmployeeModuleRoles.HR_RECRUITER
  )
);

router.get(
  '/recruitment/overview',
  validateQuery(analyticsQuerySchema),
  analyticsController.getRecruitmentOverview.bind(analyticsController)
);

router.get(
  '/recruitment/funnel',
  validateQuery(analyticsQuerySchema),
  analyticsController.getRecruitmentFunnel.bind(analyticsController)
);

router.get(
  '/ai-screening',
  validateQuery(analyticsQuerySchema),
  analyticsController.getAIScreeningStats.bind(analyticsController)
);

router.get(
  '/interviews',
  validateQuery(analyticsQuerySchema),
  analyticsController.getAIInterviewStats.bind(analyticsController)
);

router.get(
  '/recruiters',
  validateQuery(analyticsQuerySchema),
  analyticsController.getRecruiterPerformance.bind(analyticsController)
);

router.get(
  '/departments',
  validateQuery(analyticsQuerySchema),
  analyticsController.getDepartmentHiringStats.bind(analyticsController)
);

router.get(
  '/jobs',
  validateQuery(analyticsPaginationSchema),
  analyticsController.getJobPerformance.bind(analyticsController)
);

router.get(
  '/skills',
  validateQuery(analyticsQuerySchema),
  analyticsController.getSkillsIntelligence.bind(analyticsController)
);

router.get(
  '/activity',
  validateQuery(analyticsQuerySchema),
  analyticsController.getRecruitmentActivityStats.bind(analyticsController)
);

router.get(
  '/export',
  validateQuery(exportQuerySchema),
  analyticsController.exportReport.bind(analyticsController)
);

export default router;
