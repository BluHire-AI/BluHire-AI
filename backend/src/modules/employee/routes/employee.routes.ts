import { Router } from 'express';
import EmployeeController from '../controllers/employee.controller';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  promoteEmployeeSchema,
  transferEmployeeSchema,
  changeStatusSchema,
  addSkillSchema,
  addEducationSchema,
  addCertificationSchema,
  uploadDocumentSchema,
  bulkUpdateSchema,
  employeeListSchema,
} from '../validators/employee.validator';
import { requirePermission, requireEmployeeAccess } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * 1. Specific Static/Query and Search endpoints (MUST be defined before /:id)
 */

// Search employees
router.get(
  '/search/:query',
  requirePermission('read:employee'),
  EmployeeController.searchEmployees.bind(EmployeeController)
);

// Get employee directory
router.get(
  '/directory',
  requirePermission('read:directory'),
  EmployeeController.getDirectory.bind(EmployeeController)
);

// Get organization hierarchy
router.get(
  '/hierarchy',
  requirePermission('view:hierarchy'),
  EmployeeController.getHierarchy.bind(EmployeeController)
);

// Get employee statistics
router.get(
  '/stats/dashboard',
  requirePermission('read:employee'),
  EmployeeController.getStats.bind(EmployeeController)
);

// Bulk update employees
router.put(
  '/bulk/update',
  requirePermission('bulk:update'),
  validateBody(bulkUpdateSchema),
  EmployeeController.bulkUpdate.bind(EmployeeController)
);

/**
 * 2. Employee CRUD endpoints
 */

// Create employee
router.post(
  '/',
  requirePermission('create:employee'),
  validateBody(createEmployeeSchema),
  EmployeeController.createEmployee.bind(EmployeeController)
);

// List employees
router.get(
  '/',
  requirePermission('read:employee'),
  validateQuery(employeeListSchema),
  EmployeeController.listEmployees.bind(EmployeeController)
);

/**
 * 3. Parameterized endpoints (/:id must be defined after specific endpoints)
 */

// Get employee by ID
router.get(
  '/:id',
  requireEmployeeAccess(),
  EmployeeController.getEmployee.bind(EmployeeController)
);

// Update employee
router.put(
  '/:id',
  requireEmployeeAccess(),
  validateBody(updateEmployeeSchema),
  EmployeeController.updateEmployee.bind(EmployeeController)
);

// Delete employee (soft delete)
router.delete(
  '/:id',
  requirePermission('delete:employee'),
  EmployeeController.deleteEmployee.bind(EmployeeController)
);

// Get team members (reports of manager)
router.get(
  '/:id/team',
  requirePermission('read:team'),
  EmployeeController.getTeamMembers.bind(EmployeeController)
);

// Promote employee
router.post(
  '/:id/promote',
  requirePermission('update:employee'),
  validateBody(promoteEmployeeSchema),
  EmployeeController.promoteEmployee.bind(EmployeeController)
);

// Transfer employee
router.post(
  '/:id/transfer',
  requirePermission('update:employee'),
  validateBody(transferEmployeeSchema),
  EmployeeController.transferEmployee.bind(EmployeeController)
);

// Change employee status
router.post(
  '/:id/status',
  requirePermission('update:employee'),
  validateBody(changeStatusSchema),
  EmployeeController.changeStatus.bind(EmployeeController)
);

// Add skill
router.post(
  '/:id/skills',
  requireEmployeeAccess(),
  validateBody(addSkillSchema),
  EmployeeController.addSkill.bind(EmployeeController)
);

// Remove skill
router.delete(
  '/:id/skills/:skillName',
  requireEmployeeAccess(),
  EmployeeController.removeSkill.bind(EmployeeController)
);

// Add education
router.post(
  '/:id/education',
  requireEmployeeAccess(),
  validateBody(addEducationSchema),
  EmployeeController.addEducation.bind(EmployeeController)
);

// Add certification
router.post(
  '/:id/certifications',
  requireEmployeeAccess(),
  validateBody(addCertificationSchema),
  EmployeeController.addCertification.bind(EmployeeController)
);

// Upload document
router.post(
  '/:id/documents',
  requireEmployeeAccess(),
  validateBody(uploadDocumentSchema),
  EmployeeController.uploadDocument.bind(EmployeeController)
);

export default router;
