import { Router } from 'express';
import { skillController } from '../controllers/skill.controller';

const router = Router();

router.post('/', skillController.assess);
router.get('/', skillController.getList);
router.get('/insights/:employeeId', skillController.getInsights);

export default router;
