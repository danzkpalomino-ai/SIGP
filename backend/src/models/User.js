import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  role: {
    type: String,
    required: true,
    enum: ['ADMIN', 'GERENCIA', 'DEV', 'CAJERO']
  }
}, {
  timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' }
});

const User = mongoose.model('User', userSchema);
export default User;
