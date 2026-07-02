import { getTenantDb } from '../../db.js';

export async function getContacts(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Contact = db.model('Contact');
    const { type, q } = req.query;
    const filter = { company_id: req.company_id, origen: 'sigp' };
    if (type) filter.type = type.toUpperCase();
    if (q) { filter.$or = [{ razon_social: { $regex: q, $options: 'i' } }, { ruc_dni: { $regex: q, $options: 'i' } }]; }
    const contacts = await Contact.find(filter).sort({ razon_social: 1 }).limit(100);
    res.json({ contacts });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function createContact(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Contact = db.model('Contact');
    const { razon_social, ruc_dni, type, direccion, telefono } = req.body;
    if (!razon_social || !ruc_dni || !type) return res.status(400).json({ message: 'razon_social, ruc_dni y type son requeridos' });
    const contact = await Contact.create({ razon_social: razon_social.toUpperCase(), ruc_dni, type: type.toUpperCase(), direccion: direccion?.toUpperCase(), telefono, company_id: req.company_id, origen: 'sigp' });
    res.status(201).json(contact);
  } catch (err) { if (err.code === 11000) return res.status(409).json({ message: 'El contacto ya existe' }); res.status(500).json({ message: err.message }); }
}

export async function getContactByDni(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Contact = db.model('Contact');
    const contact = await Contact.findOne({ ruc_dni: req.params.dni, company_id: req.company_id });
    if (!contact) return res.status(404).json({ message: 'Contacto no encontrado' });
    res.json(contact);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function updateContact(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Contact = db.model('Contact');
    const contact = await Contact.findOneAndUpdate({ _id: req.params.id, company_id: req.company_id }, { $set: req.body }, { new: true });
    if (!contact) return res.status(404).json({ message: 'Contacto no encontrado' });
    res.json(contact);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function deleteContact(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Contact = db.model('Contact');
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, company_id: req.company_id });
    if (!contact) return res.status(404).json({ message: 'Contacto no encontrado' });
    res.json({ message: 'Contacto eliminado' });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
