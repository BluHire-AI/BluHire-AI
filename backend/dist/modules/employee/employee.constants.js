"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_CODES = exports.ERROR_CODES = exports.VALIDATION_MESSAGES = exports.PAGINATION_DEFAULTS = exports.ROLE_PERMISSIONS = exports.MODULE_ROLES = exports.ACTIVITY_TYPES = exports.DESIGNATION_LEVELS = exports.EMPLOYMENT_TYPES = exports.EMPLOYMENT_STATUSES = void 0;
/**
 * Employment status values
 */
exports.EMPLOYMENT_STATUSES = {
    ACTIVE: 'ACTIVE',
    ON_LEAVE: 'ON_LEAVE',
    PROBATION: 'PROBATION',
    RESIGNED: 'RESIGNED',
    TERMINATED: 'TERMINATED',
};
/**
 * Employment type values
 */
exports.EMPLOYMENT_TYPES = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
    CONTRACT: 'CONTRACT',
    INTERN: 'INTERN',
};
/**
 * Designation levels
 */
exports.DESIGNATION_LEVELS = {
    1: 'Entry Level',
    2: 'Mid Level',
    3: 'Senior',
    4: 'Lead',
    5: 'Manager',
    6: 'Director',
    7: 'Executive',
};
/**
 * Activity types
 */
exports.ACTIVITY_TYPES = {
    JOINED: 'JOINED',
    DEPARTMENT_CHANGED: 'DEPARTMENT_CHANGED',
    DESIGNATION_CHANGED: 'DESIGNATION_CHANGED',
    PROMOTION: 'PROMOTION',
    PROMOTED: 'PROMOTED',
    TRANSFERRED: 'TRANSFERRED',
    MANAGER_CHANGED: 'MANAGER_CHANGED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    SALARY_UPDATED: 'SALARY_UPDATED',
    DOCUMENT_ADDED: 'DOCUMENT_ADDED',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    SKILL_ADDED: 'SKILL_ADDED',
    SKILL_REMOVED: 'SKILL_REMOVED',
    CERTIFICATION_ADDED: 'CERTIFICATION_ADDED',
    EDUCATION_ADDED: 'EDUCATION_ADDED',
    LEAVE_STARTED: 'LEAVE_STARTED',
    LEAVE_ENDED: 'LEAVE_ENDED',
    RESIGNED: 'RESIGNED',
    TERMINATED: 'TERMINATED',
};
/**
 * Module roles for RBAC
 */
exports.MODULE_ROLES = {
    MANAGEMENT_ADMIN: 'MANAGEMENT_ADMIN',
    SENIOR_MANAGER: 'SENIOR_MANAGER',
    HR_RECRUITER: 'HR_RECRUITER',
    EMPLOYEE: 'EMPLOYEE',
};
/**
 * Permissions by role
 */
exports.ROLE_PERMISSIONS = {
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
};
/**
 * Pagination defaults
 */
exports.PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
};
/**
 * Validation messages
 */
exports.VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please provide a valid email address',
    INVALID_PHONE: 'Please provide a valid phone number',
    INVALID_DATE: 'Please provide a valid date',
    INVALID_ID: 'Invalid ID format',
    MIN_LENGTH: (field, length) => `${field} must be at least ${length} characters`,
    MAX_LENGTH: (field, length) => `${field} cannot exceed ${length} characters`,
    INVALID_ENUM: (field, values) => `${field} must be one of: ${values.join(', ')}`,
    DUPLICATE: (field, value) => `${field} "${value}" already exists`,
    NOT_FOUND: (resource) => `${resource} not found`,
    ALREADY_EXISTS: (resource) => `${resource} already exists`,
    UNAUTHORIZED: 'Unauthorized: Please login to continue',
    FORBIDDEN: 'Forbidden: You do not have permission to access this resource',
};
/**
 * Error codes
 */
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE: 'DUPLICATE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    CONFLICT: 'CONFLICT',
};
/**
 * API response codes
 */
exports.HTTP_CODES = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
};
