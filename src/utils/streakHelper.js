import PeachLog from '../models/PeachLog.js';
import User from '../models/User.js';

/**
 * Calcula la racha consecutiva 100% REAL de consumo de duraznos.
 * Regla estricta:
 * - Se debe comer mínimo 1 durazno por día.
 * - Si hoy se comieron 0 duraznos, la racha es 0 (se reinicia a cero).
 * - Si hoy se comió al menos 1 durazno, la racha es 1 + días previos consecutivos con >= 1 durazno.
 */
export const calculateUserStreak = async (userId) => {
  try {
    if (!userId) return 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Verificar si hoy comió al menos un durazno
    const todayLogs = await PeachLog.find({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const totalPeachesToday = todayLogs.reduce((sum, log) => sum + (log.peachesCount || 1), 0);

    // Si hoy no ha comido ningún durazno, la racha activa de hoy es 0
    if (totalPeachesToday === 0) {
      await User.findByIdAndUpdate(userId, { streak: 0 });
      return 0;
    }

    // 2. Si hoy sí comió, racha base = 1. Chequeamos días consecutivos hacia atrás
    let streak = 1;
    let checkDay = new Date(startOfToday);

    // Revisar hasta 90 días hacia atrás (ventana máxima de 3 meses)
    for (let i = 1; i <= 90; i++) {
      checkDay.setDate(checkDay.getDate() - 1);
      const dayStart = new Date(checkDay.getFullYear(), checkDay.getMonth(), checkDay.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(checkDay.getFullYear(), checkDay.getMonth(), checkDay.getDate(), 23, 59, 59, 999);

      const pastLog = await PeachLog.findOne({
        user: userId,
        date: { $gte: dayStart, $lte: dayEnd }
      });

      if (pastLog && pastLog.peachesCount >= 1) {
        streak += 1;
      } else {
        // Se rompió la secuencia consecutiva
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
