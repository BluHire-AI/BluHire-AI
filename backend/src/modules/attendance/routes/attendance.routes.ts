import { Router } from 'express';
import { attendanceController } from '../controllers';
import { validateBody, validateQuery } from '../../employee/middlewares/validate.middleware';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import { requireOwnRecordOrAdmin } from '../middlewares/rbac.middleware';
import { checkInSchema, checkOutSchema, updateAttendanceSchema, attendanceQuerySchema } from '../validators';

const router = Router();

// /api/v1/attendance

// Get today's attendance for logged-in employee (must be before /:id)
router.get(
  '/today',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  attendanceController.getToday.bind(attendanceController)
);

// Get summary (must be before /:id)
router.get(
  '/summary',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  attendanceController.getSummary.bind(attendanceController)
);

router.get(
  '/analytics',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  attendanceController.getAnalytics.bind(attendanceController)
);

router.post(
  '/summary/department',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  attendanceController.generateDepartmentSummary.bind(attendanceController)
);

// Check in
router.post(
  '/check-in',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(checkInSchema),
  attendanceController.checkIn.bind(attendanceController)
);

// Check out
router.post(
  '/check-out',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(checkOutSchema),
  attendanceController.checkOut.bind(attendanceController)
);

// Get attendance records
router.get(
  '/',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateQuery(attendanceQuerySchema),
  attendanceController.getAttendance.bind(attendanceController)
);

// Get specific attendance by ID
router.get(
  '/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  requireOwnRecordOrAdmin('Attendance'),
  attendanceController.getAttendanceById.bind(attendanceController)
);

// Update attendance
router.put(
  '/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(updateAttendanceSchema),
  attendanceController.updateAttendance.bind(attendanceController)
);

export default router;
