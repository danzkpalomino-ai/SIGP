import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/modulos', ctrl.getModulos);
router.get('/code/:code', ctrl.getProductByCode);
router.get('/', ctrl.getProducts);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

export default router;
