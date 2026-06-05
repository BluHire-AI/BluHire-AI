import { Router } from 'express';
import { leaveController } from '../controllers';
import { validateBody, validateQuery } from '../../employee/middlewares/validate.middleware';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import { requireOwnRecordOrAdmin, requireLeaveApprovalAccess } from '../middlewares/rbac.middleware';
import { applyLeaveSchema, updateLeaveStatusSchema, leaveQuerySchema } from '../validators';

const router = Router();

// /api/v1/leaves

router.post(
  '/',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(applyLeaveSchema),
  leaveController.applyLeave.bind(leaveController)
);

router.get(
  '/',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateQuery(leaveQuerySchema),
  leaveController.getLeaves.bind(leaveController)
);

router.get(
  '/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireOwnRecordOrAdmin('Leave'),
  leaveController.getLeaveById.bind(leaveController)
);

router.put(
  '/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireOwnRecordOrAdmin('Leave'),
  validateBody(applyLeaveSchema), // Reuse for full update or create custom
  // Note: We might want a separate update schema, but the prompt endpoints said PUT /:id
  leaveController.applyLeave.bind(leaveController) 
);

router.post(
  '/:id/approve',
  requireRole(EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireLeaveApprovalAccess(),
  leaveController.updateLeaveStatus.bind(leaveController)
);

router.post(
  '/:id/reject',
  requireRole(EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireLeaveApprovalAccess(),
  leaveController.updateLeaveStatus.bind(leaveController)
);

router.post(
  '/:id/cancel',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireOwnRecordOrAdmin('Leave'),
  leaveController.cancelLeave.bind(leaveController)
);

export default router;
