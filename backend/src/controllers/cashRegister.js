import { getTenantDb } from '../db.js';

export async function openShift(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Shift = db.model('Shift');
    const Sale = db.model('Sale');

    const existing = await Shift.findOne({ company_id: req.company_id, estado: 'ABIERTO' });
    if (existing) return res.status(400).json({ message: 'Ya hay un turno abierto. Ciérralo primero.' });

    const { monto_inicial = 0, notas } = req.body;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = await Sale.find({
      company_id: req.company_id, origen: 'sigp',
      fecha_emision: today, estado: 'COMPLETADO'
    });
    const ventas_total = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
    const ventas_count = todaySales.length;

    const shift = await Shift.create({
      cajero_id: req.user._id,
      cajero_nombre: req.user.username,
      monto_inicial,
      notas,
      ventas_total,
      ventas_count,
      company_id: req.company_id
    });

    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function closeShift(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Shift = db.model('Shift');
    const Sale = db.model('Sale');

    const shift = await Shift.findOne({ _id: req.params.id, company_id: req.company_id, estado: 'ABIERTO' });
    if (!shift) return res.status(404).json({ message: 'Turno no encontrado o ya cerrado' });

    const { monto_final_real } = req.body;
    const ingresos = shift.movimientos.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0);
    const egresos = shift.movimientos.filter(m => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0);

    const today = new Date().toISOString().split('T')[0];
    const todaySales = await Sale.find({
      company_id: req.company_id, origen: 'sigp',
      fecha_emision: today, estado: 'COMPLETADO'
    });
    const ventas_total = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
    const ventas_count = todaySales.length;

    const monto_final_esperado = shift.monto_inicial + ingresos - egresos + ventas_total;
    const diferencia = (monto_final_real || monto_final_esperado) - monto_final_esperado;

    shift.estado = 'CERRADO';
    shift.cierre = new Date();
    shift.monto_final_esperado = monto_final_esperado;
    shift.monto_final_real = monto_final_real || monto_final_esperado;
    shift.diferencia = diferencia;
    shift.ventas_total = ventas_total;
    shift.ventas_count = ventas_count;

    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCurrentShift(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Shift = db.model('Shift');
    const Sale = db.model('Sale');

    const shift = await Shift.findOne({ company_id: req.company_id, estado: 'ABIERTO' }).sort({ apertura: -1 });

    const today = new Date().toISOString().split('T')[0];
    const todaySales = await Sale.find({
      company_id: req.company_id, origen: 'sigp',
      fecha_emision: today, estado: 'COMPLETADO'
    });
    const ventas_total = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
    const ventas_count = todaySales.length;

    const response = shift ? shift.toObject() : null;
    if (response) {
      response.ventas_total = ventas_total;
      response.ventas_count = ventas_count;
    }

    res.json({ shift: response, todaySales: { total: ventas_total, count: ventas_count } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addMovement(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Shift = db.model('Shift');

    const shift = await Shift.findOne({ _id: req.params.id, company_id: req.company_id, estado: 'ABIERTO' });
    if (!shift) return res.status(404).json({ message: 'Turno no encontrado o cerrado' });

    const { tipo, monto, motivo } = req.body;
    if (!tipo || !monto || monto <= 0) return res.status(400).json({ message: 'Tipo y monto requeridos' });

    shift.movimientos.push({ tipo, monto, motivo, registrado_por: req.user._id });
    await shift.save();

    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getShiftHistory(req, res) {
  try {
    const db = getTenantDb(req.company_id);
    const Shift = db.model('Shift');

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [shifts, total] = await Promise.all([
      Shift.find({ company_id: req.company_id }).skip(skip).limit(Number(limit)).sort({ apertura: -1 }),
      Shift.countDocuments({ company_id: req.company_id })
    ]);

    res.json({ shifts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
