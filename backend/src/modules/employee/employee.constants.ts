/**
 * Employment status values
 */
export const EMPLOYMENT_STATUSES = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  PROBATION: 'PROBATION',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
} as const;

/**
 * Employment type values
 */
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
} as const;

/**
 * Designation levels
 */
export const DESIGNATION_LEVELS = {
  1: 'Entry Level',
  2: 'Mid Level',
  3: 'Senior',
  4: 'Lead',
  5: 'Manager',
  6: 'Director',
  7: 'Executive',
} as const;

/**
 * Activity types
 */
export const ACTIVITY_TYPES = {
  JOINED: 'JOINED',
  DEPARTMENT_CHANGED: 'DEPARTMENT_CHANGED',
  DESIGNATION_CHANGED: 'DESIGNATION_CHANGED',
  PROMOTION: 'PROMOTION',
  MANAGER_CHANGED: 'MANAGER_CHANGED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  SALARY_UPDATED: 'SALARY_UPDATED',
  DOCUMENT_ADDED: 'DOCUMENT_ADDED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  SKILL_ADDED: 'SKILL_ADDED',
  CERTIFICATION_ADDED: 'CERTIFICATION_ADDED',
  LEAVE_STARTED: 'LEAVE_STARTED',
  LEAVE_ENDED: 'LEAVE_ENDED',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
} as const;

/**
 * Module roles for RBAC
 */
export const MODULE_ROLES = {
  MANAGEMENT_ADMIN: 'MANAGEMENT_ADMIN',
  SENIOR_MANAGER: 'SENIOR_MANAGER',
  HR_RECRUITER: 'HR_RECRUITER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

/**
 * Permissions by role
 */
export const ROLE_PERMISSIONS = {
  MANAGEMENT_ADMIN: [
    'create:employee',
    'read:employee',
    'update:employee',
    'delete:employee',
    'manage:department',
    'manage:designation',
    'view:hierarchy',
    'manage:roles',
    'bulk:update',
  ],
  SENIOR_MANAGER: [
    'read:employee',
    'read:team',
    'update:team',
    'view:hierarchy',
    'read:department',
  ],
  HR_RECRUITER: [
    'create:employee',
    'read:employee',
    'update:employee',
    'read:department',
    'read:designation',
    'view:directory',
  ],
  EMPLOYEE: [
    'read:own_profile',
    'update:own_profile',
    'read:directory',
  ],
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_DATE: 'Please provide a valid date',
  INVALID_ID: 'Invalid ID format',
  MIN_LENGTH: (field: string, length: number) => `${field} must be at least ${length} characters`,
  MAX_LENGTH: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
  INVALID_ENUM: (field: string, values: string[]) => `${field} must be one of: ${values.join(', ')}`,
  DUPLICATE: (field: string, value: string) => `${field} "${value}" already exists`,
  NOT_FOUND: (resource: string) => `${resource} not found`,
  ALREADY_EXISTS: (resource: string) => `${resource} already exists`,
  UNAUTHORIZED: 'Unauthorized: Please login to continue',
  FORBIDDEN: 'Forbidden: You do not have permission to access this resource',
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  CONFLICT: 'CONFLICT',
} as const;

/**
 * API response codes
 */
export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
