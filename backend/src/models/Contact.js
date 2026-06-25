const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  razon_social: { type: String, required: true, uppercase: true },
  ruc_dni: { type: String, required: true },
  type: { type: String, enum: ['CLIENTE', 'PROVEEDOR'], required: true },
  direccion: { type: String, uppercase: true },
  telefono: { type: String },
  email: { type: String },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  origen: { type: String, default: 'sigp', enum: ['sicce', 'sigp'] }
}, {
  timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' }
});

contactSchema.index({ company_id: 1, ruc_dni: 1 }, { unique: true });

module.exports = { schema: contactSchema };
