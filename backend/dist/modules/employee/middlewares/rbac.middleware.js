"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEmployeeAccess = exports.getAllRoles = exports.getPermissionsForRole = exports.attachPermissions = exports.requireOwnResourceOrAdmin = exports.requireAllPermissions = exports.requirePermission = exports.requireRole = exports.EmployeeModuleRoles = void 0;
const Employee_1 = __importDefault(require("../../../models/Employee"));
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
/**
 * Allow access if the user is MANAGEMENT_ADMIN / HR_RECRUITER OR if the employee record belongs to the logged-in user.
 */
const requireEmployeeAccess = () => {
    return async (req, res, next) => {
        const userRole = req.user?.role;
        const userId = req.user?._id;
        if (!userRole || !userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No active session',
                statusCode: 401,
            });
        }
        // Admins and HR recruiters can access any employee record
        if (userRole === EmployeeModuleRoles.MANAGEMENT_ADMIN ||
            userRole === EmployeeModuleRoles.HR_RECRUITER) {
            return next();
        }
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Bad Request: Employee ID parameter is missing',
                statusCode: 400,
            });
        }
        try {
            const employee = await Employee_1.default.findOne({ _id: id, isDeleted: false });
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Server error verifying access',
                statusCode: 500,
            });
        }
    };
};
exports.requireEmployeeAccess = requireEmployeeAccess;
