import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  producto_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  descripcion: { type: String, uppercase: true },
  codigo_pos: { type: String },
  cantidad: { type: Number, required: true },
  precio_unitario: { type: Number, required: true },
  total_item: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  correlativo: { type: Number, required: true },
  tipo_documento: { type: String, default: '03' },
  serie: { type: String, required: true },
  numero: { type: String, required: true },
  cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  cliente_nombre: { type: String },
  cliente_dni: { type: String },
  fecha_emision: { type: String, required: true },
  moneda: { type: String, default: 'PEN' },
  subtotal: Number,
  igv: Number,
  total: { type: Number, required: true },
  estado: { type: String, enum: ['COMPLETADO', 'ANULADO', 'DEVUELTO', 'PENDIENTE', 'COTIZACION'], default: 'COMPLETADO' },
  metodo_pago: { type: String, enum: ['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'OTROS'], default: 'EFECTIVO' },
  validez: { type: Number, default: 7 },
  fecha_expiracion: { type: String },
  items: [saleItemSchema],
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  origen: { type: String, default: 'sigp', enum: ['sicce', 'sigp'] },
  punto_venta: { type: String, default: 'POS-SIGP' },
  caja: { type: String, default: 'Caja 01' },
  sync: {
    sicce: { type: Boolean, default: false },
    sicce_at: { type: Date }
  }
}, {
  timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' }
});

saleSchema.index({ company_id: 1, origen: 1 });
saleSchema.index({ company_id: 1, serie: 1, numero: 1 }, { unique: true });
saleSchema.index({ company_id: 1, 'sync.sicce': 1 });

export { saleSchema, saleItemSchema };
