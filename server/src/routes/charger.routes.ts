import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/charger.controller';

const router = Router();

// Public discovery
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/availability', ctrl.availability);

// Host-only management
router.post('/', requireAuth, requireRole('host'), ctrl.create);
router.patch('/:id', requireAuth, requireRole('host'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('host'), ctrl.remove);

export default router;
