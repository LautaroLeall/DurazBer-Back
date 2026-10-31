import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { calculateUserStreak } from '../utils/streakHelper.js';
import { getRequestTzOffset } from '../utils/dateHelper.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, dailyGoal } = req.body;
    const tzOffset = getRequestTzOffset(req);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const user = await User.create({
      name: name || 'Cosechador de Duraznos',
      email,
      password,
      dailyGoal: dailyGoal || 4,
      streak: 0
    });

    const token = generateToken(res, user._id);
    const streak = await calculateUserStreak(user._id, tzOffset);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dailyGoal: user.dailyGoal,
      streak,
      avatar: user.avatar,
      token
    });
  } catch (error) {
    res.status(500).json({ message: `Error al registrar usuario: ${error.message}` });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tzOffset = getRequestTzOffset(req);

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor completá correo y contraseña' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(res, user._id);
      const streak = await calculateUserStreak(user._id, tzOffset);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        dailyGoal: user.dailyGoal,
        streak,
        avatar: user.avatar,
        token
      });
    } else {
      res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: `Error en login: ${error.message}` });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Sesión cerrada exitosamente' });
};

export const getUserProfile = async (req, res) => {
  try {
    const tzOffset = getRequestTzOffset(req);
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      const streak = await calculateUserStreak(user._id, tzOffset);
      const userObj = user.toObject();
      userObj.streak = streak;
      res.json(userObj);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const tzOffset = getRequestTzOffset(req);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.name = req.body.name || user.name;
    user.dailyGoal = req.body.dailyGoal !== undefined ? Number(req.body.dailyGoal) : user.dailyGoal;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const streak = await calculateUserStreak(updatedUser._id, tzOffset);
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      dailyGoal: updatedUser.dailyGoal,
      streak,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
