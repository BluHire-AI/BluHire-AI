import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { employeeRoutes } from '../modules/employee';
import { publicRecruitmentRouter, adminRecruitmentRouter } from '../modules/recruitment';
import aiRouter from '../modules/recruitment/ai/ai.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import copilotRoutes from '../modules/copilot/copilot.routes';
import { performanceRoutes } from '../modules/performance';
import knowledgeRoutes from '../modules/knowledge/routes/knowledge.routes';
import attendanceRoutes from '../modules/attendance/routes';
import { payrollRoutes } from '../modules/payroll';

import dashboardRoutes from './dashboard.routes';
import candidateRoutes from './candidate.routes';
import systemRoutes from './system.routes';
import { authorize } from '../middlewares/role.middleware';
import { SystemRoles } from '../models/roles';

const apiRouter = Router();

const RECRUITMENT_ROLES = [
  SystemRoles.MANAGEMENT_ADMIN, 
  SystemRoles.SENIOR_MANAGER, 
  SystemRoles.HR_RECRUITER
];

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/public/recruitment', publicRecruitmentRouter);
apiRouter.use('/recruitment', authenticate, adminRecruitmentRouter);
apiRouter.use('/dashboard', authenticate, authorize(RECRUITMENT_ROLES), dashboardRoutes);
apiRouter.use('/candidates', authenticate, authorize(RECRUITMENT_ROLES), candidateRoutes);
apiRouter.use('/system', systemRoutes);
apiRouter.use('/ai', authenticate, authorize(RECRUITMENT_ROLES), aiRouter);
apiRouter.use('/analytics', authenticate, analyticsRoutes);
apiRouter.use('/copilot', authenticate, copilotRoutes);
apiRouter.use('/performance', authenticate, performanceRoutes);
apiRouter.use('/knowledge', authenticate, knowledgeRoutes);
apiRouter.use('/', authenticate, attendanceRoutes);
apiRouter.use('/', authenticate, employeeRoutes);
apiRouter.use('/', authenticate, payrollRoutes);

export default apiRouter;

