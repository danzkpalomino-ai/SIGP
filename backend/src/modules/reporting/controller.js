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
