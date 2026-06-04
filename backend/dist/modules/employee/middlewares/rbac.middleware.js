"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRoles = exports.getPermissionsForRole = exports.attachPermissions = exports.requireOwnResourceOrAdmin = exports.requireAllPermissions = exports.requirePermission = exports.requireRole = exports.EmployeeModuleRoles = void 0;
var EmployeeModuleRoles;
(function (EmployeeModuleRoles) {
    EmployeeModuleRoles["MANAGEMENT_ADMIN"] = "MANAGEMENT_ADMIN";
    EmployeeModuleRoles["SENIOR_MANAGER"] = "SENIOR_MANAGER";
    EmployeeModuleRoles["HR_RECRUITER"] = "HR_RECRUITER";
    EmployeeModuleRoles["EMPLOYEE"] = "EMPLOYEE";
})(EmployeeModuleRoles || (exports.EmployeeModuleRoles = EmployeeModuleRoles = {}));
/**
 * Permission mapping for different roles
 */
const rolePermissions = {
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
const requireRole = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No role assigned',
                statusCode: 401,
            });
        }
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions',
                statusCode: 403,
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Check if user has required permission
 */
const requirePermission = (...permissions) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No role assigned',
                statusCode: 401,
            });
        }
        const userPermissions = rolePermissions[userRole] || [];
        const hasPermission = permissions.some((permission) => userPermissions.includes(permission));
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions',
                statusCode: 403,
            });
        }
        next();
        console.log("Role from JWT:", req.user?.role);
        console.log("Permissions:", rolePermissions[req.user?.role]);
    };
};
exports.requirePermission = requirePermission;
/**
 * Check if user has all required permissions
 */
const requireAllPermissions = (...permissions) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No role assigned',
                statusCode: 401,
            });
        }
        const userPermissions = rolePermissions[userRole] || [];
        const hasAllPermissions = permissions.every((permission) => userPermissions.includes(permission));
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
exports.requireAllPermissions = requireAllPermissions;
/**
 * Only allow user to view/edit their own profile
 */
const requireOwnResourceOrAdmin = (resourceField = 'userId') => {
    return (req, res, next) => {
        const userRole = req.user?.role;
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
exports.requireOwnResourceOrAdmin = requireOwnResourceOrAdmin;
/**
 * Middleware to inject user role permissions
 */
const attachPermissions = (req, res, next) => {
    const userRole = req.user?.role;
    req.userPermissions = rolePermissions[userRole] || [];
    next();
};
exports.attachPermissions = attachPermissions;
/**
 * Get available permissions for a role
 */
const getPermissionsForRole = (role) => {
    return rolePermissions[role] || [];
};
exports.getPermissionsForRole = getPermissionsForRole;
/**
 * Get all available roles
 */
const getAllRoles = () => {
    return Object.values(EmployeeModuleRoles);
};
exports.getAllRoles = getAllRoles;
