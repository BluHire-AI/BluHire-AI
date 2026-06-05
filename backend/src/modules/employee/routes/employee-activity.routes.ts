import { Router } from 'express';
import EmployeeActivityController from '../controllers/employee-activity.controller';
import { validateQuery } from '../middlewares/validate.middleware';
import {
  activityListSchema,
} from '../validators/employee-activity.validator';
import { requirePermission, requireEmployeeAccess } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * Activity query endpoints
 */

// Get recent activities
router.get(
  '/recent',
  requirePermission('read:employee'),
  EmployeeActivityController.getRecent.bind(EmployeeActivityController)
);

// Get activities by date range
router.get(
  '/date-range',
  requirePermission('read:employee'),
  EmployeeActivityController.getByDateRange.bind(EmployeeActivityController)
);

// Get activity by ID
router.get(
  '/:id',
  requirePermission('read:employee'),
  EmployeeActivityController.getActivity.bind(EmployeeActivityController)
);

// List activities
router.get(
  '/',
  requirePermission('read:employee'),
  validateQuery(activityListSchema),
  EmployeeActivityController.listActivities.bind(EmployeeActivityController)
);

// Get employee timeline
router.get(
  '/employee/:employeeId/timeline',
  requireEmployeeAccess(),
  EmployeeActivityController.getEmployeeTimeline.bind(EmployeeActivityController)
);

// Get activities by employee
router.get(
  '/employee/:employeeId',
  requireEmployeeAccess(),
  EmployeeActivityController.getByEmployee.bind(EmployeeActivityController)
);

// Get activities by type
router.get(
  '/type/:activityType',
  requirePermission('read:employee'),
  EmployeeActivityController.getByType.bind(EmployeeActivityController)
);

/**
 * Activity analytics endpoints
 */

// Get activity statistics
router.get(
  '/stats/dashboard',
  requirePermission('read:employee'),
  EmployeeActivityController.getStats.bind(EmployeeActivityController)
);

// Get activity summary
router.get(
  '/summary/dashboard',
  requirePermission('read:employee'),
  EmployeeActivityController.getSummary.bind(EmployeeActivityController)
);

// Get activity distribution
router.get(
  '/distribution',
  requirePermission('read:employee'),
  EmployeeActivityController.getDistribution.bind(EmployeeActivityController)
);

// Get employee activity count
router.get(
  '/employee/:employeeId/count',
  requireEmployeeAccess(),
  EmployeeActivityController.getEmployeeActivityCount.bind(EmployeeActivityController)
);

/**
 * Search endpoints
 */

// Search activities
router.get(
  '/search/:query',
  requirePermission('read:employee'),
  EmployeeActivityController.searchActivities.bind(EmployeeActivityController)
);

export default router;
