import { Router } from 'express';
import { systemController } from '../controllers/system.controller';

const router = Router();

router.get('/email-health', systemController.getEmailHealth);

export default router;
