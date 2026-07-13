import { getTenantDb } from '../../db.js';
import Company from '../../models/Company.js';

export async function getCompanies(req, res) {
  try {
    const companies = await Company.find({ active: true });
    res.json(companies);
  } catch (error) { res.status(500).json({ message: 'Error al obtener empresas' }); }
}

export async function createCompany(req, res) {
  try {
    const { name, ruc, address, phone, email } = req.body;
    if (!name || !ruc) return res.status(400).json({ message: 'Nombre y RUC requeridos' });
    const company = await Company.create({ name, ruc, address, phone, email });
    res.status(201).json(company);
  } catch (error) { if (error.code === 11000) return res.status(409).json({ message: 'El RUC ya existe' }); res.status(500).json({ message: error.message }); }
}

export async function updateCompany(req, res) {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(company);
  } catch (error) { res.status(500).json({ message: error.message }); }
}

export async function deleteCompany(req, res) {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json({ message: 'Empresa desactivada' });
  } catch (error) { res.status(500).json({ message: error.message }); }
}

export async function getPuntosVenta(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const PuntoVenta = db.model('PuntoVenta');
    const puntos = await PuntoVenta.find({ company_id: req.company_id, activo: true }).sort({ nombre: 1 });
    res.json(puntos);
  } catch (error) { res.status(500).json({ message: error.message }); }
}

export async function createPuntoVenta(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const PuntoVenta = db.model('PuntoVenta');
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
    const pv = await PuntoVenta.create({ nombre: nombre.toUpperCase(), company_id: req.company_id });
    res.status(201).json(pv);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Ya existe un punto de venta con ese nombre' });
    res.status(500).json({ message: error.message });
  }
}

export async function deletePuntoVenta(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const PuntoVenta = db.model('PuntoVenta');
    await PuntoVenta.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Punto de venta desactivado' });
  } catch (error) { res.status(500).json({ message: error.message }); }
}
