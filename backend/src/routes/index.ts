import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { employeeRoutes } from '../modules/employee';
import { publicRecruitmentRouter, adminRecruitmentRouter } from '../modules/recruitment';
import aiRouter from '../modules/recruitment/ai/ai.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/public/recruitment', publicRecruitmentRouter);
apiRouter.use('/recruitment', authenticate, adminRecruitmentRouter);
apiRouter.use('/ai', authenticate, aiRouter);
apiRouter.use('/analytics', authenticate, analyticsRoutes);
apiRouter.use('/', authenticate, employeeRoutes);

export default apiRouter;
