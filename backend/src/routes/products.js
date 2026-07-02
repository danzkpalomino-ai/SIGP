import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductByCode, getModulos } from '../controllers/products.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/modulos', getModulos);
router.get('/code/:code', getProductByCode);
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
