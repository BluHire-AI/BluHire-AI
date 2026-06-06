import { Router } from 'express';
import reviewRoutes from './review.routes';
import goalRoutes from './goal.routes';
import skillRoutes from './skill.routes';
import promotionRoutes from './promotion.routes';
import analyticsRoutes from './analytics.routes';
import { intelligenceController } from '../controllers/intelligence.controller';

const router = Router();

router.use('/reviews', reviewRoutes);
router.use('/goals', goalRoutes);
router.use('/skills', skillRoutes);
router.use('/promotions', promotionRoutes);
router.use('/analytics', analyticsRoutes);

// Intelligence Pack Routes
router.get('/trends/:employeeId', intelligenceController.getTrends);
router.get('/risk', intelligenceController.getRisk);
router.get('/learning-plan/:employeeId', intelligenceController.getLearningPlan);
router.get('/calibration', intelligenceController.getCalibration);
router.get('/succession', intelligenceController.getSuccession);

export default router;
