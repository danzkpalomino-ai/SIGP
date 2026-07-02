import { Router } from 'express';
import { createPurchase, getPurchases, updatePurchase, deletePurchase } from '../controllers/purchases.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createPurchase);
router.get('/', getPurchases);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
