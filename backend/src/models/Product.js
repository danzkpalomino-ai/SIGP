const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  descripcion: { type: String, required: true, uppercase: true },
  marca: { type: String, uppercase: true },
  categoria: { type: String, uppercase: true },
  item_type: { type: String, enum: ['PRODUCTO', 'MERCADERIA', 'INSUMO', 'SERVICIO'], default: 'PRODUCTO' },
  stock_actual: { type: Number, default: 0 },
  stock_minimo: { type: Number, default: 0 },
  precio_unitario: { type: Number, default: 0 },
  unidad_medida: { type: String, default: 'UND' },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  origen: { type: String, default: 'sigp', enum: ['sicce', 'sigp'] },
  modulo_pos: { type: String, uppercase: true },
  codigo_pos: { type: String, unique: true, sparse: true },
  activo_pos: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' }
});

productSchema.index({ company_id: 1, codigo_pos: 1 });
productSchema.index({ company_id: 1, modulo_pos: 1 });

module.exports = { schema: productSchema };
