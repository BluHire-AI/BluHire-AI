import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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

    req.user = {
      _id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    console.log(`[AUTH] Failure: JWT verification failed. Reason: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const denyCandidate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'CANDIDATE') {
    res.status(403).json({
      success: false,
      message: 'Access denied: candidates are not allowed to access this resource.'
    });
    return;
  }
  next();
};
