import { Router } from 'express';
import { createSale, getSales, getTodaySales, getSalesStats, getSalesByProduct, updateSale } from '../controllers/sales.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createSale);
router.get('/', getSales);
router.get('/today', getTodaySales);
router.get('/stats', getSalesStats);
router.get('/by-product', getSalesByProduct);
router.put('/:id', updateSale);

export default router;
