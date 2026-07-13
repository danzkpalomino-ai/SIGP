import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/', ctrl.createSale);
router.get('/', ctrl.getSales);
router.get('/today', ctrl.getTodaySales);
router.get('/stats', ctrl.getSalesStats);
router.get('/summary', ctrl.getSalesSummary);
router.get('/by-product', ctrl.getSalesByProduct);
router.get('/status-breakdown', ctrl.getSalesStatusBreakdown);
router.get('/hourly', ctrl.getSalesHourly);
router.put('/:id', ctrl.updateSale);

router.post('/quotations', ctrl.createQuotation);
router.get('/quotations', ctrl.getQuotations);
router.put('/quotations/:id/convert', ctrl.convertQuotationToSale);

export default router;
