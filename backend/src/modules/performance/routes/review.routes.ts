import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';

const router = Router();

router.post('/', reviewController.create);
router.put('/:id', reviewController.update);
router.get('/', reviewController.getList);
router.get('/comparison/:employeeId', reviewController.getComparison);
router.get('/:id', reviewController.getById);
router.delete('/:id', reviewController.delete);

export default router;
