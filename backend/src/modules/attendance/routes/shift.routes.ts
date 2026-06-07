import { Router } from 'express';
import { shiftController } from '../controllers';
import { validateBody } from '../../employee/middlewares/validate.middleware';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import { createShiftSchema, updateShiftSchema } from '../validators';

const router = Router();

// /api/v1/shifts

router.post(
  '/',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(createShiftSchema),
  shiftController.createShift.bind(shiftController)
);

router.get(
  '/',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  shiftController.getShifts.bind(shiftController)
);

router.get(
  '/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  shiftController.getShiftById.bind(shiftController)
);

router.put(
  '/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(updateShiftSchema),
  shiftController.updateShift.bind(shiftController)
);

router.delete(
  '/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  shiftController.deleteShift.bind(shiftController)
);

export default router;
