import { Router } from 'express';
import { getProducts, createProduct, getProductByCode, getModulos } from '../controllers/products.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/modulos', getModulos);
router.get('/code/:code', getProductByCode);
router.get('/', getProducts);
router.post('/', createProduct);

export default router;
