import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} from '../validators/authValidators';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);
// Forgot and Reset password can be added similarly

export default router;
