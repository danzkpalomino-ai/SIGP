import { Router } from 'express';
import * as ctrl from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/dni/:dni', ctrl.getContactByDni);
router.get('/', ctrl.getContacts);
router.post('/', ctrl.createContact);
router.put('/:id', ctrl.updateContact);
router.delete('/:id', ctrl.deleteContact);

export default router;
