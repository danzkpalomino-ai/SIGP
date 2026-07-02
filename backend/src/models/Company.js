import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  ruc: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  email: String,
  logo: String,
  active: { type: Boolean, default: true },
  auto_sync_sicce: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
