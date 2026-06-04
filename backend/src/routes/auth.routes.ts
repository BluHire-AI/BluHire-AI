import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidators';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;
