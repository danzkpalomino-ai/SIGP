import { Router } from 'express';
import { createPurchase, getPurchases } from '../controllers/purchases.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createPurchase);
router.get('/', getPurchases);

export default router;
