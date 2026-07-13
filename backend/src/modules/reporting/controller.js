import { getTenantDb } from '../../db.js';

export async function getDashboardStats(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const Product = db.model('Product');
    const Contact = db.model('Contact');
    const today = new Date().toISOString().split('T')[0];
    const [todaySales, productCount, clientCount] = await Promise.all([
      Sale.find({ company_id: req.company_id, origen: 'sigp', fecha_emision: today, estado: 'COMPLETADO' }),
      Product.countDocuments({ company_id: req.company_id, origen: 'sigp', activo_pos: true }),
      Contact.countDocuments({ company_id: req.company_id, origen: 'sigp', type: 'CLIENTE' })
    ]);
    const total_ventas_hoy = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
    res.json({ ventas_hoy: { total: total_ventas_hoy, count: todaySales.length }, productos_activos: productCount, clientes: clientCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getReportHistory(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const Shift = db.model('Shift');
    const { page = 1, limit = 20, tipo = 'ventas', fecha_desde, fecha_hasta } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (tipo === 'caja') {
      const filter = { company_id: req.company_id };
      if (fecha_desde || fecha_hasta) {
        filter.apertura = {};
        if (fecha_desde) filter.apertura.$gte = new Date(fecha_desde);
        if (fecha_hasta) filter.apertura.$lte = new Date(new Date(fecha_hasta).setHours(23, 59, 59, 999));
      }
      const [shifts, total] = await Promise.all([
        Shift.find(filter).skip(skip).limit(Number(limit)).sort({ apertura: -1 }),
        Shift.countDocuments(filter)
      ]);
      return res.json({ items: shifts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    }

    const filter = { company_id: req.company_id, origen: 'sigp', estado: 'COMPLETADO' };
    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }
    const [sales, total] = await Promise.all([
      Sale.find(filter).skip(skip).limit(Number(limit)).sort({ creado_en: -1 }),
      Sale.countDocuments(filter)
    ]);
    res.json({ items: sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getReportSummary(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, tipo = 'diario' } = req.query;
    const filter = { company_id: req.company_id, origen: 'sigp', estado: 'COMPLETADO' };
    if (fecha_desde || fecha_hasta) {
      filter.fecha_emision = {};
      if (fecha_desde) filter.fecha_emision.$gte = fecha_desde;
      if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta;
    }

    const sales = await Sale.find(filter).sort({ fecha_emision: 1 });
    const total_ventas = sales.length;
    const total_ingresos = sales.reduce((a, s) => a + (s.total || 0), 0);
    const total_igv = sales.reduce((a, s) => a + (s.igv || 0), 0);
    const total_productos_vendidos = sales.reduce((a, s) => a + s.items.reduce((acc, it) => acc + (it.cantidad || 0), 0), 0);
    const promedio_por_venta = total_ventas > 0 ? total_ingresos / total_ventas : 0;

    const grouped = {};
    sales.forEach(s => {
      const key = tipo === 'mensual' ? s.fecha_emision?.substring(0, 7) : s.fecha_emision;
      if (!grouped[key]) grouped[key] = { fecha: key, ventas: 0, ingresos: 0, igv: 0 };
      grouped[key].ventas++;
      grouped[key].ingresos += s.total || 0;
      grouped[key].igv += s.igv || 0;
    });

    res.json({
      total_ventas, total_ingresos, total_igv, total_productos_vendidos, promedio_por_venta,
      grouped: Object.values(grouped).sort((a, b) => a.fecha < b.fecha ? 1 : -1)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
