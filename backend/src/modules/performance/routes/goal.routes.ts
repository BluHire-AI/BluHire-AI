import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';

const router = Router();

router.post('/', goalController.create);
router.put('/:id', goalController.update);
router.get('/', goalController.getList);
router.get('/:id', goalController.getById);
router.delete('/:id', goalController.delete);

export default router;
