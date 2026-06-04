import { Request, Response, NextFunction } from 'express';

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
    'view:directory',
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
