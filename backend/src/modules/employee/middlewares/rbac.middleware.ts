import { Request, Response, NextFunction } from 'express';
import EmployeeModel from '../../../models/Employee';

export enum EmployeeModuleRoles {
  MANAGEMENT_ADMIN = 'MANAGEMENT_ADMIN',
  SENIOR_MANAGER = 'SENIOR_MANAGER',
  HR_RECRUITER = 'HR_RECRUITER',
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * Permission mapping for different roles
 */
const rolePermissions: Record<EmployeeModuleRoles, string[]> = {
  [EmployeeModuleRoles.MANAGEMENT_ADMIN]: [
    'create:employee',
    'read:employee',
    'update:employee',
    'delete:employee',

    'manage:department',
    'read:department',

    'manage:designation',
    'read:designation',
    'read:directory',
    'read:team',
    'read:department',
    'view:directory',

    'view:hierarchy',
    'manage:roles',
    'bulk:update',
  ],
  [EmployeeModuleRoles.SENIOR_MANAGER]: [
    'read:employee',
    'read:team',
    'update:team',
    'view:hierarchy',
    'read:department',
  ],
  [EmployeeModuleRoles.HR_RECRUITER]: [
    'create:employee',
    'read:employee',
    'update:employee',
    'read:department',
    'read:designation',
    'read:directory',
    'view:directory',
    'view:hierarchy',
  ],
  [EmployeeModuleRoles.EMPLOYEE]: [
    'read:own_profile',
    'update:own_profile',
    'read:directory',
  ],
};

/**
 * Check if user has required role
 */
export const requireRole = (...roles: EmployeeModuleRoles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No role assigned',
        statusCode: 401,
      });
    }

    if (!roles.includes(userRole as EmployeeModuleRoles)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        statusCode: 403,
      });
    }

    next();
  };
};

/**
 * Check if user has required permission
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No role assigned',
        statusCode: 401,
      });
    }

    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        statusCode: 403,
      });
    }

    next();
    console.log("Role from JWT:", req.user?.role);
    console.log("Permissions:", rolePermissions[req.user?.role as EmployeeModuleRoles]);
  };
  
};

/**
 * Check if user has all required permissions
 */
export const requireAllPermissions = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No role assigned',
        statusCode: 401,
      });
    }

    const userPermissions = rolePermissions[userRole] || [];

    const hasAllPermissions = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        statusCode: 403,
      });
    }

    next();
  };
};

/**
 * Only allow user to view/edit their own profile
 */
export const requireOwnResourceOrAdmin = (resourceField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;
    const userId = req.user?._id;

    // Admin can access all resources
    if (userRole === EmployeeModuleRoles.MANAGEMENT_ADMIN) {
      return next();
    }

    // Get resource ID from params or body
    const resourceId = req.params[resourceField] || req.body[resourceField];

    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own resources',
        statusCode: 403,
      });
    }

    next();
  };
};

/**
 * Middleware to inject user role permissions
 */
export const attachPermissions = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role as EmployeeModuleRoles;
  req.userPermissions = rolePermissions[userRole] || [];
  next();
};

/**
 * Get available permissions for a role
 */
export const getPermissionsForRole = (role: EmployeeModuleRoles): string[] => {
  return rolePermissions[role] || [];
};

/**
 * Get all available roles
 */
export const getAllRoles = (): EmployeeModuleRoles[] => {
  return Object.values(EmployeeModuleRoles);
};

// Extend Express Request interface to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: string;
      };
      userPermissions?: string[];
    }
  }
}

/**
 * Allow access if the user is MANAGEMENT_ADMIN / HR_RECRUITER OR if the employee record belongs to the logged-in user.
 */
export const requireEmployeeAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;
    const userId = req.user?._id;

    if (!userRole || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No active session',
        statusCode: 401,
      });
    }

    // Admins and HR recruiters can access any employee record
    if (
      userRole === EmployeeModuleRoles.MANAGEMENT_ADMIN ||
      userRole === EmployeeModuleRoles.HR_RECRUITER
    ) {
      return next();
    }

    const id = req.params.id || req.params.employeeId;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request: Employee ID parameter is missing',
        statusCode: 400,
      });
    }

    try {
      const employee = await EmployeeModel.findOne({ _id: id, isDeleted: false });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee record not found',
          statusCode: 404,
        });
      }

      // Check if this employee record belongs to the logged in user
      if (employee.userId && employee.userId.toString() === userId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own profile',
        statusCode: 403,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Server error verifying access',
        statusCode: 500,
      });
    }
  };
};
