import { Router } from 'express';
import authRoutes from './auth.routes';
import chargerRoutes from './charger.routes';
import bookingRoutes from './booking.routes';
import hostRoutes from './host.routes';
import miscRoutes from './misc.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'chargesense-api' } });
});

router.use('/auth', authRoutes);
router.use('/chargers', chargerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/host', hostRoutes);
router.use('/', miscRoutes); // /cars, /estimate, /dashboard

export default router;
