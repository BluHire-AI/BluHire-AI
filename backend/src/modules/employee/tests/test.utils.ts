/**
 * Employee Module Test Utilities
 * 
 * Helper functions and mock data for testing the Employee Management module
 */

import { EmploymentStatus, EmploymentType } from '../../../models/Employee';
import { ActivityType } from '../../../models/EmployeeActivity';

/**
 * Mock user objects for testing different roles
 */
export const mockUsers = {
  admin: {
    _id: 'admin-123',
    email: 'admin@example.com',
    role: 'MANAGEMENT_ADMIN',
  },
  manager: {
    _id: 'manager-123',
    email: 'manager@example.com',
    role: 'SENIOR_MANAGER',
  },
  recruiter: {
    _id: 'recruiter-123',
    email: 'recruiter@example.com',
    role: 'HR_RECRUITER',
  },
  employee: {
    _id: 'employee-123',
    email: 'employee@example.com',
    role: 'EMPLOYEE',
  },
};

/**
 * Mock employee data for testing
 */
export const mockEmployeeData = {
  basic: {
    employeeCode: 'EMP001',
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    departmentId: 'dept-123',
    designationId: 'desig-123',
    employmentType: EmploymentType.FULL_TIME,
    joiningDate: new Date('2024-01-01'),
    workLocation: 'New York',
  },
  fullProfile: {
    employeeCode: 'EMP002',
    userId: 'user-124',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0456',
    gender: 'FEMALE',
    dateOfBirth: new Date('1990-05-15'),
    departmentId: 'dept-123',
    designationId: 'desig-124',
    managerId: 'emp-123',
    employmentType: EmploymentType.FULL_TIME,
    joiningDate: new Date('2023-06-01'),
    experience: 5,
    skills: ['JavaScript', 'React', 'Node.js'],
    salaryGrade: 'Grade-B',
    workLocation: 'San Francisco',
    emergencyContact: {
      name: 'John Smith',
      phone: '+1-555-9999',
      relationship: 'Spouse',
    },
    address: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    },
  },
};

/**
 * Mock department data
 */
export const mockDepartmentData = {
  basic: {
    name: 'Engineering',
    description: 'Software Development',
  },
  full: {
    name: 'Engineering',
    description: 'Software Development Department',
    departmentHead: 'emp-123',
  },
};

/**
 * Mock designation data
 */
export const mockDesignationData = {
  basic: {
    title: 'Senior Engineer',
    description: 'Senior level software engineer',
    departmentId: 'dept-123',
    level: 3,
  },
  levels: {
    junior: { title: 'Junior Engineer', level: 1 },
    mid: { title: 'Engineer', level: 2 },
    senior: { title: 'Senior Engineer', level: 3 },
    lead: { title: 'Tech Lead', level: 4 },
    manager: { title: 'Engineering Manager', level: 5 },
    director: { title: 'Engineering Director', level: 6 },
    executive: { title: 'VP Engineering', level: 7 },
  },
};

/**
 * Mock activity data
 */
export const mockActivityData = {
  joined: {
    employeeId: 'emp-123',
    activityType: ActivityType.JOINED,
    title: 'Employee Joined',
    description: 'John Doe joined the company',
  },
  promotion: {
    employeeId: 'emp-123',
    activityType: ActivityType.PROMOTION,
    title: 'Employee Promoted',
    description: 'John Doe was promoted to Senior Engineer',
  },
  transfer: {
    employeeId: 'emp-123',
    activityType: ActivityType.DEPARTMENT_CHANGED,
    title: 'Department Changed',
    description: 'John Doe was transferred to Product Engineering',
  },
};

/**
 * Test request builders
 */
export const buildEmployeeRequest = (overrides?: any) => ({
  ...mockEmployeeData.basic,
  ...overrides,
});

export const buildDepartmentRequest = (overrides?: any) => ({
  ...mockDepartmentData.basic,
  ...overrides,
});

export const buildDesignationRequest = (overrides?: any) => ({
  ...mockDesignationData.basic,
  ...overrides,
});

/**
 * Validation test data
 */
export const invalidEmployeeData = {
  invalidCode: { employeeCode: 'emp-001' }, // lowercase
  missingRequired: { employeeCode: '', firstName: 'John' }, // missing fields
  invalidEmail: { email: 'not-an-email' },
  invalidPhone: { phone: '123' },
  invalidDateOfBirth: { dateOfBirth: 'not-a-date' },
  invalidLevel: { level: 10 }, // should be 1-7
};

/**
 * Pagination test data
 */
export const paginationTestCases = [
  { page: 1, limit: 10 },
  { page: 2, limit: 20 },
  { page: 1, limit: 100 },
  { page: 0, limit: 10 }, // invalid
  { page: 1, limit: 1000 }, // exceeds max
];

/**
 * Filter test cases
 */
export const filterTestCases = {
  byStatus: { employmentStatus: EmploymentStatus.ACTIVE },
  byDepartment: { departmentId: 'dept-123' },
  byDesignation: { designationId: 'desig-123' },
  byType: { employmentType: EmploymentType.FULL_TIME },
  multiple: {
    employmentStatus: EmploymentStatus.ACTIVE,
    departmentId: 'dept-123',
    employmentType: EmploymentType.FULL_TIME,
  },
};

/**
 * Permission test cases
 */
export const permissionTestCases = [
  {
    role: 'MANAGEMENT_ADMIN',
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canManageDepartments: true,
  },
  {
    role: 'SENIOR_MANAGER',
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canManageDepartments: false,
  },
  {
    role: 'HR_RECRUITER',
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canManageDepartments: false,
  },
  {
    role: 'EMPLOYEE',
    canCreate: false,
    canRead: true, // own profile only
    canUpdate: false,
    canDelete: false,
    canManageDepartments: false,
  },
];

/**
 * Search test cases
 */
export const searchTestCases = [
  { query: 'john' }, // First name
  { query: 'doe' }, // Last name
  { query: 'john.doe' }, // Email part
  { query: 'emp001' }, // Employee code
  { query: '+1-555' }, // Phone part
];

/**
 * Activity type test cases
 */
export const activityTypeTestCases = Object.values(ActivityType).map((type) => ({
  type,
  description: `Test for ${type} activity`,
}));

/**
 * Status change test cases
 */
export const statusChangeTestCases = [
  {
    from: EmploymentStatus.PROBATION,
    to: EmploymentStatus.ACTIVE,
    description: 'Probation to Active',
  },
  {
    from: EmploymentStatus.ACTIVE,
    to: EmploymentStatus.ON_LEAVE,
    description: 'Active to On Leave',
  },
  {
    from: EmploymentStatus.ACTIVE,
    to: EmploymentStatus.RESIGNED,
    description: 'Active to Resigned',
  },
];

/**
 * Helper to create test JWT token
 */
export const createTestToken = (user: any): string => {
  // This is a placeholder - implement actual JWT creation in your test setup
  return Buffer.from(JSON.stringify(user)).toString('base64');
};

/**
 * Helper to generate test IDs
 */
export const generateTestId = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper to compare objects with custom fields ignored
 */
export const compareObjects = (obj1: any, obj2: any, ignoreFields: string[] = []): boolean => {
  const filtered1 = Object.keys(obj1)
    .filter((key) => !ignoreFields.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj1[key] }), {});

  const filtered2 = Object.keys(obj2)
    .filter((key) => !ignoreFields.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj2[key] }), {});

  return JSON.stringify(filtered1) === JSON.stringify(filtered2);
};

/**
 * Helper to wait for async operations
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
