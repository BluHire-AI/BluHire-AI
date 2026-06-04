import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { employeeRoutes } from '../modules/employee';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/', authenticate, employeeRoutes);

export default apiRouter;
