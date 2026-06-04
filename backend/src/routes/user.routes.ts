import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { userUpdateSchema } from '../validators/authValidators';
import { SystemRoles } from '../models/roles';

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Profile routes
router.get('/me', userController.getMe);
router.put('/me', validateRequest(userUpdateSchema), userController.updateMe);

// Admin / HR Management routes
router.get('/', authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]), userController.listUsers);
router.get('/:id', authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]), userController.getUser);

// CRUD for Admin
router.put('/:id', authorize([SystemRoles.MANAGEMENT_ADMIN]), validateRequest(userUpdateSchema), userController.updateUser);
router.delete('/:id', authorize([SystemRoles.MANAGEMENT_ADMIN]), userController.deleteUser);

export default router;
