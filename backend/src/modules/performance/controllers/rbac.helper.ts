import { Response } from 'express';
import Employee from '../../../models/Employee';
import { SystemRoles } from '../../../models/roles';

export interface ScopedAccess {
  allowed: boolean;
  filter: any;
  employeeId?: string;
  departmentId?: string;
  employeeIds?: string[];
}

export async function getScopedAccess(user: any): Promise<ScopedAccess> {
  if (!user) {
    return { allowed: false, filter: {} };
  }

  const role = user.role;

  if (role === SystemRoles.MANAGEMENT_ADMIN) {
    return { allowed: true, filter: {} };
  }

  if (role === SystemRoles.HR_RECRUITER) {
    return { allowed: true, filter: {} };
  }

  // Retrieve employee record mapped to this user account
  const employee = await Employee.findOne({ userId: user._id, isDeleted: false });
  if (!employee) {
    return { allowed: false, filter: {} };
  }

  if (role === SystemRoles.EMPLOYEE) {
    return {
      allowed: true,
      filter: { employeeId: employee._id },
      employeeId: employee._id.toString()
    };
  }

  if (role === SystemRoles.SENIOR_MANAGER) {
    const employeeIds = await Employee.find({
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

export function hasWriteAccess(role: string): boolean {
  return role === SystemRoles.MANAGEMENT_ADMIN || role === SystemRoles.SENIOR_MANAGER;
}
