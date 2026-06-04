import { Router } from 'express';
import DepartmentController from '../controllers/department.controller';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignDepartmentHeadSchema,
  departmentListSchema,
} from '../validators/department.validator';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * Department query endpoints
 */

// Get all active departments
router.get(
  '/active',
  requirePermission('read:department'),
  DepartmentController.getActiveDepartments.bind(DepartmentController)
);

// Get department statistics
router.get(
  '/stats/dashboard',
  requirePermission('read:department'),
  DepartmentController.getStats.bind(DepartmentController)
);

/**
 * Department CRUD endpoints
 */

// Create department
router.post(
  '/',
  requirePermission('manage:department'),
  validateBody(createDepartmentSchema),
  DepartmentController.createDepartment.bind(DepartmentController)
);

// List departments
router.get(
  '/',
  requirePermission('read:department'),
  validateQuery(departmentListSchema),
  DepartmentController.listDepartments.bind(DepartmentController)
);

// Get department by ID
router.get(
  '/:id',
  requirePermission('read:department'),
  DepartmentController.getDepartment.bind(DepartmentController)
);

// Update department
router.put(
  '/:id',
  requirePermission('manage:department'),
  validateBody(updateDepartmentSchema),
  DepartmentController.updateDepartment.bind(DepartmentController)
);

// Delete department
router.delete(
  '/:id',
  requirePermission('manage:department'),
  DepartmentController.deleteDepartment.bind(DepartmentController)
);

// Get department with details
router.get(
  '/:id/details',
  requirePermission('read:department'),
  DepartmentController.getDepartmentDetails.bind(DepartmentController)
);

/**
 * Department management endpoints
 */

// Assign department head
router.post(
  '/:id/head',
  requirePermission('manage:department'),
  validateBody(assignDepartmentHeadSchema),
  DepartmentController.assignHead.bind(DepartmentController)
);

// Remove department head
router.delete(
  '/:id/head',
  requirePermission('manage:department'),
  DepartmentController.removeHead.bind(DepartmentController)
);

// Toggle department status
router.patch(
  '/:id/toggle-status',
  requirePermission('manage:department'),
  DepartmentController.toggleStatus.bind(DepartmentController)
);

/**
 * Department analytics endpoints
 */

// Get department statistics
router.get(
  '/stats/dashboard',
  requirePermission('read:department'),
  DepartmentController.getStats.bind(DepartmentController)
);

/**
 * Search endpoints
 */

// Search departments
router.get(
  '/search/:query',
  requirePermission('read:department'),
  DepartmentController.searchDepartments.bind(DepartmentController)
);

export default router;
