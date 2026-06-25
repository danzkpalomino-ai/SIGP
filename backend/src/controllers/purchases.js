import { getTenantDb } from '../db.js';

export async function createPurchase(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Purchase = db.model('Purchase');
    const Product = db.model('Product');

    const { items, proveedor_nombre, proveedor_ruc, total, tipo_compra } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Debe agregar al menos un ítem' });

    const count = await Purchase.countDocuments({ company_id: req.company_id });
    const correlativo = count + 1;

    const subtotal = items.reduce((acc, it) => acc + (it.total_item || it.cantidad * it.precio_unitario), 0);
    const igv = subtotal * 0.18;
    const totalFinal = total || subtotal + igv;

    // Actualizar stock (solo si es mercadería o si se especifica)
    for (const item of items) {
      if (item.producto_id) {
        await Product.findByIdAndUpdate(item.producto_id, { $inc: { stock_actual: item.cantidad } });
      }
    }

    const purchase = await Purchase.create({
      correlativo,
      tipo_documento: '01',
      serie: 'C001',
      numero: String(correlativo).padStart(6, '0'),
      proveedor_nombre,
      proveedor_ruc,
      fecha_emision: new Date().toISOString().split('T')[0],
      subtotal,
      igv,
      total: totalFinal,
      items: items.map(it => ({
        ...it,
        descripcion: it.descripcion?.toUpperCase(),
        total_item: it.total_item || it.cantidad * it.precio_unitario
      })),
      company_id: req.company_id,
      registrado_por: req.user?._id,
      origen: 'sigp',
      tipo_compra: tipo_compra || 'mercadera'
    });

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getPurchases(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Purchase = db.model('Purchase');
    const { page = 1, limit = 25, fecha_desde, fecha_hasta, tipo_compra } = req.query;
    const filter = { company_id: req.company_id, origen: 'sigp' };
    if (tipo_compra) filter.tipo_compra = tipo_compra;
    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      Purchase.find(filter).skip(skip).limit(Number(limit)).sort({ creado_en: -1 }),
      Purchase.countDocuments(filter)
    ]);
    res.json({ purchases, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
