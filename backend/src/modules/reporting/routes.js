import { Router } from 'express';
import { getDashboardStats } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);

export default router;
