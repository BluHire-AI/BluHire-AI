import { Router } from 'express';
import employeeRoutes from './employee.routes';
import departmentRoutes from './department.routes';
import designationRoutes from './designation.routes';
import activityRoutes from './employee-activity.routes';
import { attachPermissions } from '../middlewares/rbac.middleware';

const router = Router();

// Attach permissions middleware
router.use(attachPermissions);

/**
 * Employee Management Routes
 * Base path: /api/v1
 */

// Employee routes
router.use('/employees', employeeRoutes);

// Department routes
router.use('/departments', departmentRoutes);

// Designation routes
router.use('/designations', designationRoutes);

// Activity/Timeline routes
router.use('/activities', activityRoutes);

export default router;
