import PeachLog from '../models/PeachLog.js';
import User from '../models/User.js';
import { calculateUserStreak } from '../utils/streakHelper.js';
import {
  getRequestTzOffset,
  getRelativeLocalDayBoundsUTC,
  getLocalDayBoundsUTC
} from '../utils/dateHelper.js';

const calculateNutrients = (count = 0) => {
  return {
    kcal: count * 63,
    fiberGrams: +(count * 2.3).toFixed(1),
    vitCPercent: Math.min(count * 17, 100),
    waterPercent: 89
  };
};

/**
 * Construye el resumen completo del día actual en la zona horaria del usuario
 * ejecutando la consulta de registros del día y el cálculo de racha en paralelo.
 */
const buildTodaySummary = async (userId, dailyGoal = 4, tzOffset = 180) => {
  const { start, end, dateKey } = getRelativeLocalDayBoundsUTC(0, tzOffset);

  const [todayLogs, streak] = await Promise.all([
    PeachLog.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: -1 })
      .lean(),
    calculateUserStreak(userId, tzOffset)
  ]);

  const totalPeaches = todayLogs.reduce((acc, log) => acc + (log.peachesCount || 1), 0);
  const nutrients = calculateNutrients(totalPeaches);
  const progressPercent = Math.min(Math.round((totalPeaches / dailyGoal) * 100), 100);

  return {
    date: new Date().toISOString(),
    dateKey,
    totalPeaches,
    dailyGoal,
    streak,
    progressPercent,
    isGoalReached: totalPeaches >= dailyGoal,
    nutrients,
    todayLogs
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

    const tzOffset = getRequestTzOffset(req);
    const dailyGoal = req.user?.dailyGoal || 4;
    const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: `Error al obtener resumen: ${error.message}` });
  }
};

/**
 * Sumar duraznos (+1, +2) directamente a la base de datos y devolver el resumen actualizado
 */
export const quickIncrement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);
    const dailyGoal = req.user?.dailyGoal || 4;
    const amount = Math.max(1, Math.min(20, Number(req.body.amount) || 1));
    const nutrients = calculateNutrients(amount);

    const [newLog] = await Promise.all([
      PeachLog.create({
        user: userId,
        date: new Date(),
        peachesCount: amount,
        weightGrams: amount * 150,
        mealType: req.body.mealType || 'Snack',
        nutrients
      }),
      User.findByIdAndUpdate(userId, { lastActiveDate: new Date() })
    ]);

    const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);

    res.status(201).json({
      message: `¡Sumaste ${amount} durazno(s) a tu cosecha!`,
      log: newLog,
      streak: summary.streak,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: `Error al sumar durazno: ${error.message}` });
  }
};

/**
 * Restar 1 durazno (o eliminar la última toma del día local) en la base de datos
 */
export const quickDecrement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);
    const dailyGoal = req.user?.dailyGoal || 4;
    const { start, end } = getRelativeLocalDayBoundsUTC(0, tzOffset);

    const latestLog = await PeachLog.findOne({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    if (!latestLog) {
      const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);
      return res.status(400).json({
        message: 'No hay duraznos registrados hoy para restar',
        summary
      });
    }

    if (latestLog.peachesCount > 1) {
      latestLog.peachesCount -= 1;
      latestLog.weightGrams = latestLog.peachesCount * 150;
      latestLog.nutrients = calculateNutrients(latestLog.peachesCount);
      await latestLog.save();
      const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);
      return res.json({
        message: 'Se restó 1 durazno',
        log: latestLog,
        streak: summary.streak,
        summary
      });
    } else {
      await PeachLog.findByIdAndDelete(latestLog._id);
      const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);
      return res.json({
        message: 'Se eliminó la toma de durazno',
        deletedId: latestLog._id,
        streak: summary.streak,
        summary
      });
    }
  } catch (error) {
    res.status(500).json({ message: `Error al restar durazno: ${error.message}` });
  }
};

/**
 * Historial real por día respetando el huso horario del usuario
 */
export const getHistoryLogs = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);
    const { date, limit = 50 } = req.query;
    const filter = { user: userId };

    if (date) {
      const parts = String(date).split('-').map(Number);
      if (parts.length === 3 && !parts.some(Number.isNaN)) {
        const [year, month, day] = parts;
        const { start, end } = getLocalDayBoundsUTC(year, month - 1, day, tzOffset);
        filter.date = { $gte: start, $lte: end };
      }
    }

    const logs = await PeachLog.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Eliminar una toma individual y devolver resumen actualizado
 */
export const deleteLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);
    const dailyGoal = req.user?.dailyGoal || 4;

    const log = await PeachLog.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!log) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    const summary = await buildTodaySummary(userId, dailyGoal, tzOffset);
    res.json({
      message: 'Registro eliminado',
      id: req.params.id,
      deletedLog: log,
      streak: summary.streak,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
