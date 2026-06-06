import { Router } from 'express';
import aiController from './ai.controller';
import { EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';

const aiRouter = Router();

// RBAC middleware with logging
aiRouter.use((req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  const allowedRoles = [EmployeeModuleRoles.MANAGEMENT_ADMIN, EmployeeModuleRoles.HR_RECRUITER];
  const isAllowed = allowedRoles.includes(userRole);

  console.log(`[RBAC] Role validation. User role: "${userRole}", Allowed roles: [${allowedRoles.join(', ')}], Result: ${isAllowed ? 'SUCCESS' : 'FAILED'}`);

  if (!isAllowed) {
    console.log(`[RBAC] Failure: User role "${userRole}" lacks permission to access AI screening routes.`);
    res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient permissions',
      statusCode: 403
    });
    return;
  }
  next();
});

aiRouter.post('/screen', aiController.screen.bind(aiController));
aiRouter.post('/screen/bulk', aiController.screenBulk.bind(aiController));
aiRouter.get('/screen/:applicationId', aiController.getScreenResult.bind(aiController));
aiRouter.get('/analytics', aiController.getAnalytics.bind(aiController));
aiRouter.get('/health', aiController.healthCheck.bind(aiController));

export default aiRouter;
