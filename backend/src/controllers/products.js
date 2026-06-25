import { getTenantDb } from '../db.js';

export async function getProducts(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const { modulo, q, activo } = req.query;
    const filter = { origen: 'sigp' };
    if (modulo) filter.modulo_pos = modulo.toUpperCase();
    if (activo === 'true') filter.activo_pos = true;
    if (q) {
      filter.$or = [
        { descripcion: { $regex: q, $options: 'i' } },
        { codigo_pos: { $regex: q, $options: 'i' } }
      ];
    }
    const products = await Product.find(filter).sort({ creado_en: -1 }).limit(200);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const { descripcion, marca, categoria, modulo_pos, precio_unitario, item_type } = req.body;
    if (!descripcion) return res.status(400).json({ message: 'Descripción requerida' });

    const count = await Product.countDocuments({ company_id: req.company_id, modulo_pos: modulo_pos?.toUpperCase() || 'GENERAL' });
    const codigo_pos = `${(modulo_pos || 'GEN').toUpperCase().slice(0, 3)}-${(categoria || 'GEN').toUpperCase().slice(0, 3)}-${String(count + 1).padStart(4, '0')}`;

    const product = await Product.create({
      descripcion: descripcion.toUpperCase(),
      marca: marca?.toUpperCase(),
      categoria: categoria?.toUpperCase(),
      modulo_pos: modulo_pos?.toUpperCase(),
      precio_unitario: Number(precio_unitario) || 0,
      item_type: item_type || 'PRODUCTO',
      codigo_pos,
      company_id: req.company_id,
      origen: 'sigp'
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getProductByCode(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const product = await Product.findOne({ codigo_pos: req.params.code, company_id: req.company_id });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getModulos(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const modulos = await Product.distinct('modulo_pos', { company_id: req.company_id, origen: 'sigp', modulo_pos: { $ne: null } });
    res.json({ modulos: modulos.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
