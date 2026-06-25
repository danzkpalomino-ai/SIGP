import { Router } from 'express';
import { createSale, getSales, getTodaySales } from '../controllers/sales.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createSale);
router.get('/', getSales);
router.get('/today', getTodaySales);

export default router;
