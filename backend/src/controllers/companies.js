import Company from '../models/Company.js';

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ active: true });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, ruc, address, phone, email } = req.body;
    if (!name || !ruc) return res.status(400).json({ message: 'Nombre y RUC requeridos' });
    const company = await Company.create({ name, ruc, address, phone, email });
    res.status(201).json(company);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'El RUC ya existe' });
    res.status(500).json({ message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json({ message: 'Empresa desactivada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
