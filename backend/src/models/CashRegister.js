import mongoose from 'mongoose';

const cashMovementSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['INGRESO', 'EGRESO'], required: true },
  monto: { type: Number, required: true },
  motivo: { type: String, uppercase: true },
  registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'creado_en' } });

const shiftSchema = new mongoose.Schema({
  cajero_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cajero_nombre: { type: String },
  estado: { type: String, enum: ['ABIERTO', 'CERRADO'], default: 'ABIERTO' },
  monto_inicial: { type: Number, default: 0 },
  monto_final_esperado: { type: Number },
  monto_final_real: { type: Number },
  diferencia: { type: Number },
  apertura: { type: Date, default: Date.now },
  cierre: { type: Date },
  ventas_total: { type: Number, default: 0 },
  ventas_count: { type: Number, default: 0 },
  movimientos: [cashMovementSchema],
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  notas: { type: String, uppercase: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

shiftSchema.index({ company_id: 1, estado: 1 });
shiftSchema.index({ company_id: 1, apertura: -1 });

export { shiftSchema, cashMovementSchema };
