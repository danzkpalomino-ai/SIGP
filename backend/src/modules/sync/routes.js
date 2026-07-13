import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/products', ctrl.syncGetProducts);
router.get('/sales', ctrl.syncGetSales);
router.post('/import/products', ctrl.syncImportProducts);
router.post('/sales/export', ctrl.syncExportSales);
router.get('/sales/pending-count', ctrl.syncPendingCount);
router.post('/sales/toggle-auto', ctrl.syncToggleAuto);
router.get('/sales/auto-status', ctrl.syncGetAutoStatus);
router.get('/import/preview', ctrl.syncImportPreview);
router.post('/import/confirm', ctrl.syncImportConfirm);
router.get('/import/contacts-preview', ctrl.syncImportContactsPreview);
router.post('/import/contacts-confirm', ctrl.syncImportContactsConfirm);

export default router;
