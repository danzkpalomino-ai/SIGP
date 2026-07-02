import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  producto_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  descripcion: { type: String, required: true, uppercase: true },
  codigo_pos: { type: String },
  cantidad: { type: Number, required: true },
  precio_unitario: { type: Number, required: true },
  total_item: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  correlativo: { type: Number, required: true },
  tipo_documento: { type: String, default: '01' },
  serie: { type: String, required: true },
  numero: { type: String, required: true },
  proveedor_nombre: { type: String },
  proveedor_ruc: { type: String },
  tipo_compra: { type: String, enum: ['mercadera', 'insumo'], default: 'mercadera' },
  fecha_emision: { type: String, required: true },
  moneda: { type: String, default: 'PEN' },
  subtotal: Number,
  igv: Number,
  total: { type: Number, required: true },
  estado: { type: String, enum: ['COMPLETADO', 'ANULADO'], default: 'COMPLETADO' },
  items: [purchaseItemSchema],
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  origen: { type: String, default: 'sigp', enum: ['sicce', 'sigp'] }
}, {
  timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' }
});

purchaseSchema.index({ company_id: 1, origen: 1 });

export { purchaseSchema, purchaseItemSchema };
