import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/', ctrl.createPurchase);
router.get('/', ctrl.getPurchases);
router.put('/:id', ctrl.updatePurchase);
router.delete('/:id', ctrl.deletePurchase);

export default router;
