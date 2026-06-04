// Models
export { default as EmployeeModel, EmploymentStatus, EmploymentType } from '../../models/Employee';
export { default as DepartmentModel } from '../../models/Department';
export { default as DesignationModel } from '../../models/Designation';
export { default as EmployeeActivityModel, ActivityType } from '../../models/EmployeeActivity';

// Types
export * from './employee.types';

// DTOs
export * from './dtos';

// Repositories
export {
  employeeRepository,
  departmentRepository,
  designationRepository,
  employeeActivityRepository,
} from './repositories';

// Services
export {
  employeeService,
  departmentService,
  designationService,
  employeeActivityService,
} from './services';

// Controllers
export {
  employeeController,
  departmentController,
  designationController,
  employeeActivityController,
} from './controllers';

// Validators
export * from './validators';

// Routes
export { default as employeeRoutes } from './routes';

// RBAC & Middleware
export {
  EmployeeModuleRoles,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireOwnResourceOrAdmin,
  attachPermissions,
  getPermissionsForRole,
  getAllRoles,
} from './middlewares/rbac.middleware';

export {
  validateBody,
  validateQuery,
  validateParams,
  validate,
} from './middlewares/validate.middleware';

// Constants
export {
  DESIGNATION_LEVELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  ACTIVITY_TYPES,
  MODULE_ROLES,
  ROLE_PERMISSIONS,
  PAGINATION_DEFAULTS,
  VALIDATION_MESSAGES,
  ERROR_CODES,
  HTTP_CODES,
} from './employee.constants';
