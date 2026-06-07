import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authenticate, denyCandidate } from '../middlewares/auth.middleware';
import { employeeRoutes } from '../modules/employee';
import { publicRecruitmentRouter, adminRecruitmentRouter } from '../modules/recruitment';
import aiRouter from '../modules/recruitment/ai/ai.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import copilotRoutes from '../modules/copilot/copilot.routes';
import { performanceRoutes } from '../modules/performance';
import knowledgeRoutes from '../modules/knowledge/routes/knowledge.routes';
import interviewRouter from '../modules/recruitment/interview/interview.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/public/recruitment', publicRecruitmentRouter);
apiRouter.use('/recruitment/interviews', authenticate, interviewRouter);
apiRouter.use('/recruitment', authenticate, denyCandidate, adminRecruitmentRouter);
apiRouter.use('/ai', authenticate, denyCandidate, aiRouter);
apiRouter.use('/analytics', authenticate, denyCandidate, analyticsRoutes);
apiRouter.use('/copilot', authenticate, denyCandidate, copilotRoutes);
apiRouter.use('/performance', authenticate, denyCandidate, performanceRoutes);
apiRouter.use('/knowledge', authenticate, denyCandidate, knowledgeRoutes);
apiRouter.use('/', authenticate, denyCandidate, employeeRoutes);

export default apiRouter;

