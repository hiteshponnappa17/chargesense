import { Router } from 'express';
import * as carCtrl from '../controllers/car.controller';
import * as estimateCtrl from '../controllers/estimate.controller';
import * as dashboardCtrl from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/cars', carCtrl.list);
router.post('/estimate', estimateCtrl.compute);
router.get('/dashboard', requireAuth, dashboardCtrl.driver);

export default router;
