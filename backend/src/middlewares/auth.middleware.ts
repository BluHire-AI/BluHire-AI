import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import EmployeeModel from '../models/Employee';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  console.log(`[AUTH] Incoming Authorization Header:`, authHeader ? `${authHeader.substring(0, 25)}...` : 'NONE');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[AUTH] Failure: Missing or invalid Authorization header format.`);
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = verifyAccessToken(token);
    console.log(`[AUTH] JWT verification successful. User ID extracted: ${decoded.id}, Role: ${decoded.role}`);

    // Base user info from token
    req.user = {
      id: decoded.id,
      _id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Enrich with Employee record _id so attendance/leave routes can scope correctly
    try {
      const employee = await EmployeeModel.findOne({ userId: decoded.id, isDeleted: false }).select('_id').lean();
      if (employee) {
        req.user.employeeId = employee._id.toString();
      }
    } catch {
      // Non-critical — employee record may not exist yet (e.g. HR/Admin users)
    }

    next();
  } catch (error: any) {
    console.log(`[AUTH] Failure: JWT verification failed. Reason: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
