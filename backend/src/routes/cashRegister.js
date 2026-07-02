import { Router } from 'express';
import { openShift, closeShift, getCurrentShift, addMovement, getShiftHistory } from '../controllers/cashRegister.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/shift/open', openShift);
router.post('/shift/:id/close', closeShift);
router.get('/shift/current', getCurrentShift);
router.post('/shift/:id/movement', addMovement);
router.get('/shift/history', getShiftHistory);

export default router;
