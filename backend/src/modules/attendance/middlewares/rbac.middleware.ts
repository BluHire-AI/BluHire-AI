import { Request, Response, NextFunction } from 'express';
import { EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';
import EmployeeModel from '../../../models/Employee';
import AttendanceModel from '../../../models/Attendance';
import LeaveModel from '../../../models/Leave';

/**
 * Ensures a user can only access their own attendance/leave records,
 * UNLESS they are MANAGEMENT_ADMIN, HR_RECRUITER, or the employee's Manager (SENIOR_MANAGER).
 */
export const requireOwnRecordOrAdmin = (modelToCheck: 'Attendance' | 'Leave') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;
    const userId = req.user?._id;

    if (!userRole || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', statusCode: 401 });
    }

    if (userRole === EmployeeModuleRoles.MANAGEMENT_ADMIN || userRole === EmployeeModuleRoles.HR_RECRUITER) {
      return next();
    }

    const { id } = req.params;
    if (!id) {
      // If no ID is passed, it might be a list route or create route. Let the controller handle filtering or body validation.
      return next(); 
    }

    try {
      let recordEmployeeId;
      
      if (modelToCheck === 'Attendance') {
        const record = await AttendanceModel.findById(id).select('employeeId');
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        recordEmployeeId = record.employeeId;
      } else {
        const record = await LeaveModel.findById(id).select('employeeId');
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        recordEmployeeId = record.employeeId;
      }

      // Find the employee record associated with this attendance/leave
      const employee = await EmployeeModel.findById(recordEmployeeId);
      if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

      // Check if it belongs to the logged-in user
      if (employee.userId && employee.userId.toString() === userId.toString()) {
        return next();
      }

      // Check if logged-in user is the manager of this employee
      if (userRole === EmployeeModuleRoles.SENIOR_MANAGER) {
        // Find the manager's employee record
        const managerEmployee = await EmployeeModel.findOne({ userId });
        if (managerEmployee && employee.managerId && employee.managerId.toString() === managerEmployee._id.toString()) {
          return next();
        }
      }

      return res.status(403).json({ success: false, message: 'Forbidden: Cannot access this record', statusCode: 403 });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Server error', statusCode: 500 });
    }
  };
};

/**
 * Check if the user is a manager or HR/Admin to approve/reject leaves
 */
export const requireLeaveApprovalAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as EmployeeModuleRoles;
    const userId = req.user?._id;

    if (!userRole || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', statusCode: 401 });
    }

    if (userRole === EmployeeModuleRoles.MANAGEMENT_ADMIN || userRole === EmployeeModuleRoles.HR_RECRUITER) {
      return next();
    }

    if (userRole === EmployeeModuleRoles.SENIOR_MANAGER) {
      const { id } = req.params;
      try {
        const leave = await LeaveModel.findById(id).select('employeeId');
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

        const employee = await EmployeeModel.findById(leave.employeeId);
        const managerEmployee = await EmployeeModel.findOne({ userId });

        if (managerEmployee && employee && employee.managerId && employee.managerId.toString() === managerEmployee._id.toString()) {
          return next();
        }
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', statusCode: 500 });
      }
    }

    return res.status(403).json({ success: false, message: 'Forbidden: Cannot approve/reject this leave', statusCode: 403 });
  };
};
