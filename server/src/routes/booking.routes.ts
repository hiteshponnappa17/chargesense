import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/booking.controller';

const router = Router();

router.use(requireAuth);
router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.patch('/:id/cancel', ctrl.cancel);

export default router;
