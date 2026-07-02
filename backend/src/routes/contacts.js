import { Router } from 'express';
import { getContacts, createContact, updateContact, deleteContact, getContactByDni } from '../controllers/contacts.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/dni/:dni', getContactByDni);
router.get('/', getContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
