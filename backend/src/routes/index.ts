import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { employeeRoutes } from '../modules/employee';
import { publicRecruitmentRouter, adminRecruitmentRouter } from '../modules/recruitment';

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
apiRouter.use('/', authenticate, employeeRoutes);

export default apiRouter;
