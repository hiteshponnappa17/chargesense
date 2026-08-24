import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/host.controller';

const router = Router();

router.use(requireAuth, requireRole('host'));
router.get('/dashboard', ctrl.dashboard);
router.get('/chargers', ctrl.chargers);
router.get('/bookings', ctrl.bookings);

export default router;
