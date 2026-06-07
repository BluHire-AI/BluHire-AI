import { Router } from 'express';
import { holidayController } from '../controllers';
import { validateBody, validateQuery } from '../../employee/middlewares/validate.middleware';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import { createHolidaySchema, updateHolidaySchema, holidayQuerySchema } from '../validators';

const router = Router();

// /api/v1/holidays

router.post(
  '/',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(createHolidaySchema),
  holidayController.createHoliday.bind(holidayController)
);

router.get(
  '/',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateQuery(holidayQuerySchema),
  holidayController.getHolidays.bind(holidayController)
);

router.get(
  '/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.SENIOR_MANAGER, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  holidayController.getHolidayById.bind(holidayController)
);

router.put(
  '/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  validateBody(updateHolidaySchema),
  holidayController.updateHoliday.bind(holidayController)
);

router.delete(
  '/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  holidayController.deleteHoliday.bind(holidayController)
);

export default router;
