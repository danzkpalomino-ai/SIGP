import mongoose from 'mongoose';

const puntoVentaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, uppercase: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  activo: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

puntoVentaSchema.index({ company_id: 1, nombre: 1 }, { unique: true });

export { puntoVentaSchema };
