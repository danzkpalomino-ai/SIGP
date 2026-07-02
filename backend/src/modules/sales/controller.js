import { getTenantDb } from '../../db.js';
import Company from '../../models/Company.js';

export async function createSale(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const Product = db.model('Product');
    const { items, cliente_nombre, cliente_dni, total, serie, punto_venta, caja, tipo_documento } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Debe agregar al menos un ítem' });
    const count = await Sale.countDocuments({ company_id: req.company_id });
    const correlativo = count + 1;
    const subtotal = items.reduce((acc, it) => acc + (it.total_item || it.cantidad * it.precio_unitario), 0);
    const igv = subtotal * 0.18;
    const totalFinal = total || subtotal + igv;
    for (const item of items) { if (item.producto_id) await Product.findByIdAndUpdate(item.producto_id, { $inc: { stock_actual: -item.cantidad } }); }

    const company = await Company.findById(req.company_id).select('auto_sync_sicce');
    const syncAuto = company?.auto_sync_sicce;

    const sale = await Sale.create({
      correlativo, tipo_documento: tipo_documento || '03', serie: serie || 'B001', numero: String(correlativo).padStart(6, '0'),
      cliente_nombre, cliente_dni, fecha_emision: new Date().toISOString().split('T')[0], subtotal, igv, total: totalFinal,
      items: items.map(it => ({ ...it, descripcion: it.descripcion?.toUpperCase(), total_item: it.total_item || it.cantidad * it.precio_unitario })),
      company_id: req.company_id, registrado_por: req.user?.id, origen: 'sigp', punto_venta: punto_venta || 'POS-SIGP', caja: caja || 'Caja 01',
      sync: syncAuto ? { sicce: true, sicce_at: new Date() } : { sicce: false }
    });
    res.status(201).json(sale);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { page = 1, limit = 10, fecha_desde, fecha_hasta, origen, punto_venta, caja, estado, tipo_documento, q } = req.query;
    const filter = { company_id: req.company_id };
    if (origen === 'todos') { /* ambos */ } else if (origen) { filter.origen = origen; } else { filter.origen = 'sigp'; }
    if (fecha_desde || fecha_hasta) { filter.fecha_emision = {}; if (fecha_desde) filter.fecha_emision.$gte = fecha_desde; if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta; }
    if (punto_venta) filter.punto_venta = punto_venta;
    if (caja) filter.caja = caja;
    if (estado) filter.estado = estado;
    if (tipo_documento) filter.tipo_documento = tipo_documento;
    if (q) { filter.$or = [{ cliente_nombre: { $regex: q, $options: 'i' } }, { cliente_dni: { $regex: q, $options: 'i' } }, { numero: { $regex: q, $options: 'i' } }]; }
    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      Sale.find(filter).skip(skip).limit(Number(limit)).sort({ creado_en: -1 }),
      Sale.countDocuments(filter)
    ]);
    res.json({ sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function updateSale(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const sale = await Sale.findOneAndUpdate({ _id: req.params.id, company_id: req.company_id }, { $set: req.body }, { new: true });
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(sale);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getTodaySales(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const today = new Date().toISOString().split('T')[0];
    const sales = await Sale.find({ company_id: req.company_id, origen: 'sigp', fecha_emision: today, estado: 'COMPLETADO' }).sort({ creado_en: -1 });
    const total = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSalesStats(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, origen } = req.query;
    const filter = { company_id: req.company_id, estado: 'COMPLETADO' };
    if (origen === 'todos') { /* ambos */ } else if (origen) { filter.origen = origen; } else { filter.origen = 'sigp'; }
    if (fecha_desde || fecha_hasta) { filter.fecha_emision = {}; if (fecha_desde) filter.fecha_emision.$gte = fecha_desde; if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta; }
    const sales = await Sale.find(filter);
    const total_ventas = sales.length;
    const total_ingresos = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const total_igv = sales.reduce((acc, s) => acc + (s.igv || 0), 0);
    const total_productos_vendidos = sales.reduce((acc, s) => acc + (s.items || []).reduce((a, i) => a + (i.cantidad || 0), 0), 0);
    const promedio_por_venta = total_ventas > 0 ? total_ingresos / total_ventas : 0;
    res.json({ total_ventas, total_ingresos, total_igv, total_productos_vendidos, promedio_por_venta });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSalesSummary(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';
    const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const [todaySales, yesterdaySales, monthSales] = await Promise.all([
      Sale.find({ company_id: req.company_id, fecha_emision: today }),
      Sale.find({ company_id: req.company_id, fecha_emision: yesterday }),
      Sale.find({ company_id: req.company_id, fecha_emision: { $gte: monthStart, $lte: today } })
    ]);

    const ventasHoy = todaySales.filter(s => s.estado === 'COMPLETADO').reduce((a, s) => a + (s.total || 0), 0);
    const ventasAyer = yesterdaySales.filter(s => s.estado === 'COMPLETADO').reduce((a, s) => a + (s.total || 0), 0);
    const ventasMes = monthSales.filter(s => s.estado === 'COMPLETADO').reduce((a, s) => a + (s.total || 0), 0);
    const countHoy = todaySales.filter(s => s.estado === 'COMPLETADO').length;
    const countAyer = yesterdaySales.filter(s => s.estado === 'COMPLETADO').length;
    const countMes = monthSales.filter(s => s.estado === 'COMPLETADO').length;
    const promedioHoy = countHoy > 0 ? ventasHoy / countHoy : 0;
    const promedioAyer = countAyer > 0 ? ventasAyer / countAyer : 0;
    const changeHoy = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer * 100) : 0;
    const changeMes = countMes > 0 ? ((ventasMes - ventasAyer * 30) / (ventasAyer * 30) * 100) : 0;

    const devolucionesHoy = todaySales.filter(s => s.estado === 'DEVUELTO').reduce((a, s) => a + (s.total || 0), 0);
    const devolucionesAyer = yesterdaySales.filter(s => s.estado === 'DEVUELTO').reduce((a, s) => a + (s.total || 0), 0);
    const changeDevoluciones = devolucionesAyer > 0 ? ((devolucionesHoy - devolucionesAyer) / devolucionesAyer * 100) : 0;

    res.json({
      ventas_hoy: { total: ventasHoy, count: countHoy, promedio: promedioHoy, change: changeHoy },
      ventas_mes: { total: ventasMes, count: countMes, change: changeMes },
      ventas_ayer: { total: ventasAyer, count: countAyer },
      devoluciones: { total: devolucionesHoy, change: changeDevoluciones }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSalesByProduct(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, origen, limit: qLimit = 10 } = req.query;
    const filter = { company_id: req.company_id, estado: 'COMPLETADO' };
    if (origen === 'todos') { /* ambos */ } else if (origen) { filter.origen = origen; } else { filter.origen = 'sigp'; }
    if (fecha_desde || fecha_hasta) { filter.fecha_emision = {}; if (fecha_desde) filter.fecha_emision.$gte = fecha_desde; if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta; }
    const sales = await Sale.find(filter);
    const productMap = {};
    for (const sale of sales) { for (const item of (sale.items || [])) { const key = item.descripcion || 'SIN NOMBRE'; if (!productMap[key]) productMap[key] = { producto: key, cantidad: 0, total: 0 }; productMap[key].cantidad += item.cantidad || 0; productMap[key].total += item.total_item || 0; } }
    res.json(Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, Number(qLimit)));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSalesStatusBreakdown(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha_desde, fecha_hasta, punto_venta, caja } = req.query;
    const filter = { company_id: req.company_id };
    if (fecha_desde || fecha_hasta) { filter.fecha_emision = {}; if (fecha_desde) filter.fecha_emision.$gte = fecha_desde; if (fecha_hasta) filter.fecha_emision.$lte = fecha_hasta; }
    if (punto_venta) filter.punto_venta = punto_venta;
    if (caja) filter.caja = caja;

    const allSales = await Sale.find(filter);
    const totalAll = allSales.length;
    const totalMonto = allSales.reduce((a, s) => a + (s.total || 0), 0);

    const completadas = allSales.filter(s => s.estado === 'COMPLETADO');
    const anuladas = allSales.filter(s => s.estado === 'ANULADO');
    const devueltas = allSales.filter(s => s.estado === 'DEVUELTO');
    const pendientes = allSales.filter(s => s.estado === 'PENDIENTE');

    const pct = (arr) => totalAll > 0 ? (arr.length / totalAll * 100) : 0;
    const monto = (arr) => arr.reduce((a, s) => a + (s.total || 0), 0);

    res.json({
      total: totalAll,
      total_monto: totalMonto,
      completadas: { count: completadas.length, pct: pct(completadas), total: monto(completadas) },
      anuladas: { count: anuladas.length, pct: pct(anuladas), total: monto(anuladas) },
      devueltas: { count: devueltas.length, pct: pct(devueltas), total: monto(devueltas) },
      pendientes: { count: pendientes.length, pct: pct(pendientes), total: monto(pendientes) }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getSalesHourly(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Sale = db.model('Sale');
    const { fecha } = req.query;
    const targetDate = fecha || new Date().toISOString().split('T')[0];

    const sales = await Sale.find({ company_id: req.company_id, fecha_emision: targetDate, estado: 'COMPLETADO' });

    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, total: 0 }));
    for (const sale of sales) {
      const h = new Date(sale.creado_en).getHours();
      hourly[h].count += 1;
      hourly[h].total += sale.total || 0;
    }

    res.json({ fecha: targetDate, hourly });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
