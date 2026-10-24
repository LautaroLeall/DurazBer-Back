import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = req.cookies?.jwt;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, por favor iniciá sesión' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'durazber_secret_key_ultra_segura_2026_lldp');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesión expirada, por favor volvé a iniciar sesión' });
  }
};
