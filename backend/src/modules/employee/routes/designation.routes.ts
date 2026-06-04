import { Router } from 'express';
import DesignationController from '../controllers/designation.controller';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createDesignationSchema,
  updateDesignationSchema,
  designationListSchema,
} from '../validators/designation.validator';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

// 1. Create designation
router.post(
  '/',
  requirePermission('manage:designation'),
  validateBody(createDesignationSchema),
  DesignationController.createDesignation.bind(DesignationController)
);

// 2. List designations
router.get(
  '/',
  requirePermission('read:designation'),
  validateQuery(designationListSchema),
  DesignationController.listDesignations.bind(DesignationController)
);

// 3. Static / Query endpoints (MUST be defined before /:id)
router.get(
  '/all',
  requirePermission('read:designation'),
  DesignationController.getAllDesignations.bind(DesignationController)
);

router.get(
  '/by-department/:departmentId',
  requirePermission('read:designation'),
  DesignationController.getByDepartment.bind(DesignationController)
);

router.get(
  '/by-level/:level',
  requirePermission('read:designation'),
  DesignationController.getByLevel.bind(DesignationController)
);

router.get(
  '/range/:minLevel/:maxLevel',
  requirePermission('read:designation'),
  DesignationController.getByLevelRange.bind(DesignationController)
);

router.get(
  '/levels',
  requirePermission('read:designation'),
  DesignationController.getLevels.bind(DesignationController)
);

router.get(
  '/stats/dashboard',
  requirePermission('read:designation'),
  DesignationController.getStats.bind(DesignationController)
);

router.get(
  '/search/:query',
  requirePermission('read:designation'),
  DesignationController.searchDesignations.bind(DesignationController)
);

// 4. Parameterized endpoints
router.get(
  '/:id',
  requirePermission('read:designation'),
  DesignationController.getDesignation.bind(DesignationController)
);

router.put(
  '/:id',
  requirePermission('manage:designation'),
  validateBody(updateDesignationSchema),
  DesignationController.updateDesignation.bind(DesignationController)
);

router.delete(
  '/:id',
  requirePermission('manage:designation'),
  DesignationController.deleteDesignation.bind(DesignationController)
);

export default router;
