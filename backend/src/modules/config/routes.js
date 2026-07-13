import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.getCompanies);
router.post('/', ctrl.createCompany);
router.put('/:id', ctrl.updateCompany);
router.delete('/:id', ctrl.deleteCompany);

router.get('/puntos-venta', ctrl.getPuntosVenta);
router.post('/puntos-venta', ctrl.createPuntoVenta);
router.delete('/puntos-venta/:id', ctrl.deletePuntoVenta);

export default router;
