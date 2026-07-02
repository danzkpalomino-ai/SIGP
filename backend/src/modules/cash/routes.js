import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/shift/open', ctrl.openShift);
router.post('/shift/:id/close', ctrl.closeShift);
router.get('/shift/current', ctrl.getCurrentShift);
router.post('/shift/:id/movement', ctrl.addMovement);
router.get('/shift/history', ctrl.getShiftHistory);

export default router;
