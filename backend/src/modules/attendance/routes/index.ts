import { Router } from 'express';
import attendanceRoutes from './attendance.routes';
import shiftRoutes from './shift.routes';
import leaveRoutes from './leave.routes';
import holidayRoutes from './holiday.routes';

const router = Router();

router.use('/attendance', attendanceRoutes);
router.use('/shifts', shiftRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);

export default router;
