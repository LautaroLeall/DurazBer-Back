import PeachLog from '../models/PeachLog.js';
import User from '../models/User.js';
import { calculateUserStreak } from '../utils/streakHelper.js';

const calculateNutrients = (count = 1) => {
  return {
    kcal: count * 63,
    fiberGrams: +(count * 2.3).toFixed(1),
    vitCPercent: Math.min(count * 17, 100),
    waterPercent: 89
  };
};

/**
 * Resumen del día actual 100% REAL desde MongoDB Atlas
 */
export const getTodaySummary = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayLogs = await PeachLog.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 });

    const totalPeaches = todayLogs.reduce((acc, log) => acc + (log.peachesCount || 1), 0);
    const nutrients = calculateNutrients(totalPeaches);

    const dailyGoal = req.user?.dailyGoal || 4;
    const progressPercent = Math.min(Math.round((totalPeaches / dailyGoal) * 100), 100);

    // Calcular racha en tiempo real según regla de >= 1 durazno por día
    const streak = await calculateUserStreak(userId);

    res.json({
      date: new Date().toISOString(),
      totalPeaches,
      dailyGoal,
      streak,
      progressPercent,
      isGoalReached: totalPeaches >= dailyGoal,
      nutrients,
      todayLogs
    });
  } catch (error) {
    res.status(500).json({ message: `Error al obtener resumen: ${error.message}` });
  }
};

/**
 * Sumar duraznos (+1, +2) directamente a la base de datos
 */
export const quickIncrement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const amount = Number(req.body.amount) || 1;
    const nutrients = calculateNutrients(amount);

    const newLog = await PeachLog.create({
      user: userId,
      date: new Date(),
      peachesCount: amount,
      weightGrams: amount * 150,
      mealType: req.body.mealType || 'Snack',
      nutrients
    });

    // Actualizar última actividad del usuario y recalcular racha
    await User.findByIdAndUpdate(userId, { lastActiveDate: new Date() });
    const streak = await calculateUserStreak(userId);

    res.status(201).json({
      message: `¡Sumaste ${amount} durazno(s) a tu cosecha!`,
      log: newLog,
      streak
    });
  } catch (error) {
    res.status(500).json({ message: `Error al sumar durazno: ${error.message}` });
  }
};

/**
 * Restar 1 durazno (o eliminar la última toma) en la base de datos
 */
export const quickDecrement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const latestLog = await PeachLog.findOne({
      user: userId,
      date: { $gte: startOfDay }
    }).sort({ date: -1 });

    if (!latestLog) {
      return res.status(400).json({ message: 'No hay duraznos registrados hoy para restar' });
    }

    if (latestLog.peachesCount > 1) {
      latestLog.peachesCount -= 1;
      latestLog.weightGrams = latestLog.peachesCount * 150;
      latestLog.nutrients = calculateNutrients(latestLog.peachesCount);
      await latestLog.save();
      const streak = await calculateUserStreak(userId);
      return res.json({ message: 'Se restó 1 durazno', log: latestLog, streak });
    } else {
      await PeachLog.findByIdAndDelete(latestLog._id);
      const streak = await calculateUserStreak(userId);
      return res.json({ message: 'Se eliminó la toma de durazno', deletedId: latestLog._id, streak });
    }
  } catch (error) {
    res.status(500).json({ message: `Error al restar durazno: ${error.message}` });
  }
};

/**
 * Historial real por día
 */
export const getHistoryLogs = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { date, limit = 50 } = req.query;
    const filter = { user: userId };

    if (date) {
      // Parsear año, mes y día en hora local para evitar desfase de zona horaria
      const parts = date.split('-').map(Number);
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      }
    }

    const logs = await PeachLog.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Eliminar una toma individual
 */
export const deleteLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const log = await PeachLog.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!log) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    const streak = await calculateUserStreak(userId);
    res.json({ message: 'Registro eliminado', id: req.params.id, deletedLog: log, streak });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
