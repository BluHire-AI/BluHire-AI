import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';

const router = Router();

router.post('/evaluate/:employeeId', promotionController.evaluate);
router.get('/', promotionController.getList);
router.get('/employee/:employeeId', promotionController.getByEmployeeId);

export default router;
