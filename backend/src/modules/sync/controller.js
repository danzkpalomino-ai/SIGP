import mongoose from 'mongoose';
import { getTenantDb } from '../../db.js';
import Company from '../../models/Company.js';

export async function syncGetProducts(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const products = await Product.find({ company_id: req.company_id }).sort({ creado_en: -1 }).limit(200);
    res.json({ products });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncGetSales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { desde, hasta } = req.query;
    const filter = { company_id: req.company_id, $or: [{ origen: 'sicce' }, { 'sync.sicce': true }] };
    if (desde || hasta) { filter.fecha_emision = {}; if (desde) filter.fecha_emision.$gte = desde; if (hasta) filter.fecha_emision.$lte = hasta; }
    const sales = await Sale.find(filter).sort({ creado_en: -1 }).limit(200);
    res.json({ sales });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncImportProducts(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Product = db.model('Product');
    const { products } = req.body;
    if (!products || !Array.isArray(products)) return res.status(400).json({ message: 'Se requiere un array de products' });
    let imported = 0, updated = 0;
    for (const p of products) {
      const existing = await Product.findOne({ codigo: p.codigo, company_id: req.company_id });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: { ...p, origen: 'sicce', company_id: req.company_id } });
        updated++;
      } else {
        await Product.create({ ...p, origen: 'sicce', company_id: req.company_id });
        imported++;
      }
    }
    res.json({ imported, updated, total: products.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncImportPreview(req, res) {
  try {
    const company = await Company.findById(req.company_id);
    const erpDbName = company?.tenantDbName || `erp_${req.company_id}`;
    const erpDb = mongoose.connection.client.db(erpDbName);
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { item_type: 'PRODUCTO' };
    const [products, total] = await Promise.all([
      erpDb.collection('products').find(filter).skip(skip).limit(Number(limit)).sort({ descripcion: 1 }).toArray(),
      erpDb.collection('products').countDocuments(filter)
    ]);
    const mapped = products.map(p => ({
      _id: p._id.toString(),
      descripcion: p.descripcion,
      stock_actual: p.stock_actual || 0,
      precio_unitario: p.costo_unitario || p.precio_unitario || 0,
      marca: p.marca_coleccion || '',
      categoria: p.categoria_mercaderia || ''
    }));
    res.json({ products: mapped, total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncImportConfirm(req, res) {
  try {
    const company = await Company.findById(req.company_id);
    const erpDbName = company?.tenantDbName || `erp_${req.company_id}`;
    const erpDb = mongoose.connection.client.db(erpDbName);
    const sigpDb = getTenantDb(req.company_id);
    const Product = sigpDb.model('Product');
    const { product_ids } = req.body;
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ message: 'Seleccione al menos un producto' });
    }
    let imported = 0, skipped = 0;
    for (const id of product_ids) {
      const sicceProduct = await erpDb.collection('products').findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (!sicceProduct) continue;
      const exists = await Product.findOne({ company_id: req.company_id, origen: 'sigp', descripcion: sicceProduct.descripcion });
      if (exists) { skipped++; continue; }
      const count = await Product.countDocuments({ company_id: req.company_id, origen: 'sigp' });
      const codigoPos = `SIC-${String(count + 1).padStart(5, '0')}`;
      await Product.create({
        descripcion: sicceProduct.descripcion,
        marca: sicceProduct.marca_coleccion || '',
        categoria: sicceProduct.categoria_mercaderia || '',
        stock_actual: sicceProduct.stock_actual || 0,
        precio_unitario: sicceProduct.costo_unitario || sicceProduct.precio_unitario || 0,
        item_type: 'PRODUCTO',
        codigo_pos: codigoPos,
        activo_pos: true,
        origen: 'sigp',
        company_id: req.company_id
      });
      imported++;
    }
    res.json({ imported, skipped, total: product_ids.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncImportContactsPreview(req, res) {
  try {
    const company = await Company.findById(req.company_id);
    const erpDbName = company?.tenantDbName || `erp_${req.company_id}`;
    const erpDb = mongoose.connection.client.db(erpDbName);
    const { page = 1, limit = 100, type = 'CLIENTE' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { type };
    const [contacts, total] = await Promise.all([
      erpDb.collection('contacts').find(filter).skip(skip).limit(Number(limit)).sort({ razon_social: 1 }).toArray(),
      erpDb.collection('contacts').countDocuments(filter)
    ]);
    const mapped = contacts.map(c => ({
      _id: c._id.toString(),
      razon_social: c.razon_social,
      ruc_dni: c.ruc_dni,
      direccion: c.direccion || '',
      telefono: c.telefono || '',
      email: c.email || '',
      type: c.type
    }));
    res.json({ contacts: mapped, total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncImportContactsConfirm(req, res) {
  try {
    const company = await Company.findById(req.company_id);
    const erpDbName = company?.tenantDbName || `erp_${req.company_id}`;
    const erpDb = mongoose.connection.client.db(erpDbName);
    const sigpDb = getTenantDb(req.company_id);
    const Contact = sigpDb.model('Contact');
    const { contact_ids, type } = req.body;
    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({ message: 'Seleccione al menos un contacto' });
    }
    let imported = 0, skipped = 0;
    for (const id of contact_ids) {
      const sicceContact = await erpDb.collection('contacts').findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (!sicceContact) continue;
      const exists = await Contact.findOne({ company_id: req.company_id, origen: 'sigp', ruc_dni: sicceContact.ruc_dni });
      if (exists) { skipped++; continue; }
      await Contact.create({
        razon_social: sicceContact.razon_social,
        ruc_dni: sicceContact.ruc_dni,
        type: type || sicceContact.type,
        direccion: sicceContact.direccion,
        telefono: sicceContact.telefono,
        email: sicceContact.email,
        origen: 'sigp',
        company_id: req.company_id
      });
      imported++;
    }
    res.json({ imported, skipped, total: contact_ids.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncExportSales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { sale_ids, fecha_desde, fecha_hasta, modo, paginas } = req.body;

    const filter = { company_id: req.company_id, origen: 'sigp', $or: [{ 'sync.sicce': { $ne: true } }, { sync: { $exists: false } }] };

    if (modo === 'manual') {
      if (!sale_ids?.length) return res.status(400).json({ message: 'Seleccione al menos una venta' });
      filter._id = { $in: sale_ids };
    } else if (modo === 'fecha' && (fecha_desde || fecha_hasta)) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    } else if (modo === 'paginas') {
      const n = Math.min(Math.max(Number(paginas) || 5, 1), 10);
      const limit = 25;
      const pendingIds = await Sale.find(filter).sort({ creado_en: -1 }).limit(n * limit).select('_id');
      filter._id = { $in: pendingIds.map(s => s._id) };
    }
    /* modo 'todo' no necesita filtro adicional */

    const result = await Sale.updateMany(filter, { $set: { 'sync.sicce': true, 'sync.sicce_at': new Date() } });
    res.json({ synced: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncPendingCount(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const filter = { company_id: req.company_id, origen: 'sigp' };
    const [pending, synced] = await Promise.all([
      Sale.countDocuments({ ...filter, $or: [{ 'sync.sicce': { $ne: true } }, { sync: { $exists: false } }] }),
      Sale.countDocuments({ ...filter, 'sync.sicce': true })
    ]);
    res.json({ pending, synced });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncToggleAuto(req, res) {
  try {
    const { enabled } = req.body;
    await Company.findByIdAndUpdate(req.company_id, { $set: { auto_sync_sicce: Boolean(enabled) } });
    res.json({ auto_sync_sicce: Boolean(enabled) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function syncGetAutoStatus(req, res) {
  try {
    const company = await Company.findById(req.company_id).select('auto_sync_sicce');
    res.json({ auto_sync_sicce: company?.auto_sync_sicce || false });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
