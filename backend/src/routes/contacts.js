import { Router } from 'express';
import { getContacts, createContact, getContactByDni } from '../controllers/contacts.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/dni/:dni', getContactByDni);
router.get('/', getContacts);
router.post('/', createContact);

export default router;
