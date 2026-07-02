import { getTenantDb } from '../db.js';

export async function createSale(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const Product = db.model('Product');

    const { items, cliente_nombre, cliente_dni, total, serie, punto_venta } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Debe agregar al menos un ítem' });

    const count = await Sale.countDocuments({ company_id: req.company_id });
    const correlativo = count + 1;

    const subtotal = items.reduce((acc, it) => acc + (it.total_item || it.cantidad * it.precio_unitario), 0);
    const igv = subtotal * 0.18;
    const totalFinal = total || subtotal + igv;

    for (const item of items) {
      if (item.producto_id) {
        await Product.findByIdAndUpdate(item.producto_id, { $inc: { stock_actual: -item.cantidad } });
      }
    }

    const sale = await Sale.create({
      correlativo,
      tipo_documento: '03',
      serie: serie || 'P001',
      numero: String(correlativo).padStart(6, '0'),
      cliente_nombre,
      cliente_dni,
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
      punto_venta: punto_venta || 'POS-SIGP'
    });

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getSales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { page = 1, limit = 25, fecha_desde, fecha_hasta, origen } = req.query;

    const filter = { company_id: req.company_id };
    if (origen === 'todos') {
      // show both
    } else if (origen) {
      filter.origen = origen;
    } else {
      filter.origen = 'sigp';
    }

    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      Sale.find(filter).skip(skip).limit(Number(limit)).sort({ creado_en: -1 }),
      Sale.countDocuments(filter)
    ]);
    res.json({ sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateSale(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, company_id: req.company_id },
      { $set: req.body },
      { new: true }
    );
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTodaySales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const today = new Date().toISOString().split('T')[0];
    const sales = await Sale.find({
      company_id: req.company_id,
      origen: 'sigp',
      fecha_emision: today,
      estado: 'COMPLETADO'
    }).sort({ creado_en: -1 });
    const total = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getSalesStats(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, origen } = req.query;

    const filter = { company_id: req.company_id, estado: 'COMPLETADO' };
    if (origen === 'todos') {
      // both
    } else if (origen) {
      filter.origen = origen;
    } else {
      filter.origen = 'sigp';
    }
    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }

    const sales = await Sale.find(filter);
    const total_ventas = sales.length;
    const total_ingresos = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const total_igv = sales.reduce((acc, s) => acc + (s.igv || 0), 0);
    const total_productos_vendidos = sales.reduce((acc, s) => acc + (s.items || []).reduce((a, i) => a + (i.cantidad || 0), 0), 0);
    const promedio_por_venta = total_ventas > 0 ? total_ingresos / total_ventas : 0;

    res.json({ total_ventas, total_ingresos, total_igv, total_productos_vendidos, promedio_por_venta });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getSalesByProduct(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, origen, limit: qLimit = 10 } = req.query;

    const filter = { company_id: req.company_id, estado: 'COMPLETADO' };
    if (origen === 'todos') {
      // both
    } else if (origen) {
      filter.origen = origen;
    } else {
      filter.origen = 'sigp';
    }
    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }

    const sales = await Sale.find(filter);

    const productMap = {};
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const key = item.descripcion || 'SIN NOMBRE';
        if (!productMap[key]) productMap[key] = { producto: key, cantidad: 0, total: 0 };
        productMap[key].cantidad += item.cantidad || 0;
        productMap[key].total += item.total_item || 0;
      }
    }

    const result = Object.values(productMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, Number(qLimit));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
