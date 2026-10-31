import PeachLog from '../models/PeachLog.js';
import User from '../models/User.js';
import { getRelativeLocalDayBoundsUTC, toLocalDateKey } from './dateHelper.js';

/**
 * Calcula la racha consecutiva 100% REAL de consumo de duraznos con 1 SOLA CONSULTA a MongoDB.
 * Regla estricta:
 * - Se debe comer mínimo 1 durazno por día (según la zona horaria del usuario).
 * - Si hoy se comieron 0 duraznos, la racha activa es 0.
 * - Si hoy se comió al menos 1 durazno, la racha es 1 + días previos consecutivos con >= 1 durazno.
 */
export const calculateUserStreak = async (userId, tzOffsetMinutes = 180) => {
  try {
    if (!userId) return 0;

    const todayBounds = getRelativeLocalDayBoundsUTC(0, tzOffsetMinutes);
    const oldestBounds = getRelativeLocalDayBoundsUTC(90, tzOffsetMinutes);

    // 1 SOLA CONSULTA indexada por { user: 1, date: -1 } para toda la ventana de 90 días
    const logs = await PeachLog.find({
      user: userId,
      date: { $gte: oldestBounds.start, $lte: todayBounds.end }
    })
      .select('date peachesCount')
      .lean();

    if (!logs || logs.length === 0) {
      await User.findByIdAndUpdate(userId, { streak: 0 });
      return 0;
    }

    // Agrupar cantidad de duraznos por día local (YYYY-MM-DD) en memoria O(N)
    const countByDateKey = new Map();
    for (const log of logs) {
      const key = toLocalDateKey(log.date, tzOffsetMinutes);
      const prev = countByDateKey.get(key) || 0;
      countByDateKey.set(key, prev + (log.peachesCount || 1));
    }

    const totalPeachesToday = countByDateKey.get(todayBounds.dateKey) || 0;

    // Si hoy no ha comido ningún durazno, la racha activa es 0
    if (totalPeachesToday < 1) {
      await User.findByIdAndUpdate(userId, { streak: 0 });
      return 0;
    }

    // Si hoy sí comió, racha base = 1 y verificamos días previos consecutivos en el Map en memoria
    let streak = 1;
    for (let i = 1; i <= 90; i++) {
      const pastDay = getRelativeLocalDayBoundsUTC(i, tzOffsetMinutes);
      const count = countByDateKey.get(pastDay.dateKey) || 0;
      if (count >= 1) {
        streak += 1;
      } else {
        break;
      }
    }

    await User.findByIdAndUpdate(userId, { streak });
    return streak;
  } catch (error) {
    console.error('Error calculando racha:', error);
    return 0;
  }
};
