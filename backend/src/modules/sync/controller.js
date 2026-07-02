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
