import { getTenantDb } from '../db.js';

function generateEAN13(prefix, num) {
  const code = String(prefix) + String(num).padStart(9, '0')
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return code + check
}

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
    const { descripcion, marca, categoria, modulo_pos, precio_unitario, stock_actual, item_type, imagen } = req.body;
    if (!descripcion) return res.status(400).json({ message: 'Descripción requerida' });

    const count = await Product.countDocuments({ company_id: req.company_id, modulo_pos: modulo_pos?.toUpperCase() || 'GENERAL' });
    const codigo_pos = `${(modulo_pos || 'GEN').toUpperCase().slice(0, 3)}-${(categoria || 'GEN').toUpperCase().slice(0, 3)}-${String(count + 1).padStart(4, '0')}`;

    const globalCount = await Product.countDocuments({ company_id: req.company_id });
    const codigo_barra = generateEAN13('200', globalCount + 1);

    const product = await Product.create({
      descripcion: descripcion.toUpperCase(),
      marca: marca?.toUpperCase(),
      categoria: categoria?.toUpperCase(),
      modulo_pos: modulo_pos?.toUpperCase(),
      precio_unitario: Number(precio_unitario) || 0,
      stock_actual: Number(stock_actual) || 0,
      item_type: item_type || 'PRODUCTO',
      codigo_pos,
      codigo_barra,
      imagen: imagen || undefined,
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
    const product = await Product.findOne({
      company_id: req.company_id,
      $or: [{ codigo_pos: req.params.code }, { codigo_barra: req.params.code }]
    });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, company_id: req.company_id },
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const product = await Product.findOneAndDelete({ _id: req.params.id, company_id: req.company_id });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
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
