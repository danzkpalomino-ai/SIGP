import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/history', ctrl.getReportHistory);
router.get('/summary', ctrl.getReportSummary);

export default router;
