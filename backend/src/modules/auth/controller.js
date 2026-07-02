import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Contrasena incorrecta' });

    const token = jwt.sign(
      { id: user._id, role: user.role, company_id: user.company_id, tenantId: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, company_id: user.company_id }
    });
  } catch (error) {
    console.error('[SIGP] Login error:', error);
    res.status(500).json({ message: error.message || 'Error en el servidor' });
  }
};
