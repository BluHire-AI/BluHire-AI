import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/top-performers', analyticsController.getTopPerformers);
router.get('/promotion-ready', analyticsController.getPromotionReady);
router.get('/skill-gaps', analyticsController.getSkillGaps);
router.get('/goal-completion', analyticsController.getGoalCompletion);
router.get('/manager-effectiveness', analyticsController.getManagerEffectiveness);

export default router;
