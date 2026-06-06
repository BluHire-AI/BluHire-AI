"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScopedAccess = getScopedAccess;
exports.hasWriteAccess = hasWriteAccess;
const Employee_1 = __importDefault(require("../../../models/Employee"));
const roles_1 = require("../../../models/roles");
async function getScopedAccess(user) {
    if (!user) {
        return { allowed: false, filter: {} };
    }
    const role = user.role;
    if (role === roles_1.SystemRoles.MANAGEMENT_ADMIN) {
        return { allowed: true, filter: {} };
    }
    if (role === roles_1.SystemRoles.HR_RECRUITER) {
        return { allowed: true, filter: {} };
    }
    // Retrieve employee record mapped to this user account
    const employee = await Employee_1.default.findOne({ userId: user._id, isDeleted: false });
    if (!employee) {
        return { allowed: false, filter: {} };
    }
    if (role === roles_1.SystemRoles.EMPLOYEE) {
        return {
            allowed: true,
            filter: { employeeId: employee._id },
            employeeId: employee._id.toString()
        };
    }
    if (role === roles_1.SystemRoles.SENIOR_MANAGER) {
        const employeeIds = await Employee_1.default.find({
            departmentId: employee.departmentId,
            isDeleted: false
        }).distinct('_id');
        return {
            allowed: true,
            filter: { employeeId: { $in: employeeIds } },
            departmentId: employee.departmentId.toString(),
            employeeIds: employeeIds.map(id => id.toString())
        };
    }
    return { allowed: false, filter: {} };
}
function hasWriteAccess(role) {
    return role === roles_1.SystemRoles.MANAGEMENT_ADMIN || role === roles_1.SystemRoles.SENIOR_MANAGER;
}
