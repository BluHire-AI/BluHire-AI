import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { SystemRoles } from '../models/roles';

export const authorize = (allowedRoles: SystemRoles[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(403).json({ success: false, message: 'User role not found' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
      return;
    }

    next();
  };
};
