import { Router } from 'express';
import * as ctrl from './controller.js';

const router = Router();

router.get('/reception/:companyId/:code', ctrl.getProductForReception);
router.post('/reception/:companyId/:code', ctrl.confirmReception);
router.get('/product/:companyId/:code', ctrl.getProductPublic);

export default router;
