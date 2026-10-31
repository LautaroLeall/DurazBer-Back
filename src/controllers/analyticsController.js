import PeachLog from '../models/PeachLog.js';
import { pruneOldPeachLogs } from '../utils/cleanupService.js';
import {
  getRequestTzOffset,
  getRelativeLocalDayBoundsUTC,
  getRelativeLocalMonthBoundsUTC,
  toLocalDateKey,
  getLocalParts
} from '../utils/dateHelper.js';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Estadísticas reales de los últimos 7 días (Semanal) con 1 SOLA CONSULTA a MongoDB
 */
export const getWeeklyStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);
    const dailyGoal = req.user?.dailyGoal || 4;

    const oldestDay = getRelativeLocalDayBoundsUTC(6, tzOffset);
    const todayBounds = getRelativeLocalDayBoundsUTC(0, tzOffset);

    // 1 SOLA CONSULTA para toda la semana
    const weekLogs = await PeachLog.find({
      user: userId,
      date: { $gte: oldestDay.start, $lte: todayBounds.end }
    })
      .select('date peachesCount weightGrams')
      .lean();

    // Agrupar en memoria O(N) por clave de fecha local YYYY-MM-DD
    const buckets = new Map();
    for (const log of weekLogs) {
      const key = toLocalDateKey(log.date, tzOffset);
      const current = buckets.get(key) || { count: 0, grams: 0 };
      const count = log.peachesCount || 1;
      current.count += count;
      current.grams += log.weightGrams || count * 150;
      buckets.set(key, current);
    }

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayInfo = getRelativeLocalDayBoundsUTC(i, tzOffset);
      const stats = buckets.get(dayInfo.dateKey) || { count: 0, grams: 0 };

      days.push({
        date: dayInfo.dateKey,
        dayOfWeek: DAY_NAMES[dayInfo.dayOfWeek],
        dayNumber: dayInfo.day,
        count: stats.count,
        grams: stats.grams,
        isToday: i === 0,
        metGoal: stats.count >= dailyGoal
      });
    }

    const totalWeekly = days.reduce((acc, d) => acc + d.count, 0);
    const avgDaily = +(totalWeekly / 7).toFixed(1);

    res.json({
      days,
      totalWeekly,
      avgDaily,
      dailyGoal
    });
  } catch (error) {
    res.status(500).json({ message: `Error al calcular estadísticas semanales: ${error.message}` });
  }
};

/**
 * Comparativa real de los últimos 3 meses rodantes con 1 SOLA CONSULTA a MongoDB
 */
export const getThreeMonthComparative = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tzOffset = getRequestTzOffset(req);

    const twoMonthsAgo = getRelativeLocalMonthBoundsUTC(2, tzOffset);
    const lastMonth = getRelativeLocalMonthBoundsUTC(1, tzOffset);
    const currentMonth = getRelativeLocalMonthBoundsUTC(0, tzOffset);

    const monthTargets = [
      { ...twoMonthsAgo, isCurrentMonth: false },
      { ...lastMonth, isCurrentMonth: false },
      { ...currentMonth, isCurrentMonth: true }
    ];

    // 1 SOLA CONSULTA para todo el trimestre
    const allLogs = await PeachLog.find({
      user: userId,
      date: { $gte: twoMonthsAgo.start, $lte: currentMonth.end }
    })
      .select('date peachesCount weightGrams')
      .lean();

    // Agrupar en memoria por clave YYYY-M
    const monthBuckets = new Map();
    for (const log of allLogs) {
      const parts = getLocalParts(log.date, tzOffset);
      const key = `${parts.year}-${parts.month}`;
      const bucket = monthBuckets.get(key) || { totalPeaches: 0, totalGrams: 0, entriesCount: 0 };
      const count = log.peachesCount || 1;
      bucket.totalPeaches += count;
      bucket.totalGrams += log.weightGrams || count * 150;
      bucket.entriesCount += 1;
      monthBuckets.set(key, bucket);
    }

    const months = monthTargets.map((m) => {
      const key = `${m.year}-${m.monthIndex}`;
      const stats = monthBuckets.get(key) || { totalPeaches: 0, totalGrams: 0, entriesCount: 0 };
      const monthName = MONTH_NAMES[m.monthIndex];

      return {
        monthIndex: m.monthIndex,
        monthName,
        year: m.year,
        label: `${monthName} ${m.year}`,
        totalPeaches: stats.totalPeaches,
        totalWeightKg: +(stats.totalGrams / 1000).toFixed(2),
        entriesCount: stats.entriesCount,
        isCurrentMonth: m.isCurrentMonth
      };
    });

    res.json({
      retentionPolicy: {
        maxMonths: 3,
        description: 'Almacenamiento ultra-liviano: base de datos optimizada con purga automática cada 3 meses',
        cutoffDate: twoMonthsAgo.start.toISOString().split('T')[0]
      },
      months
    });
  } catch (error) {
    res.status(500).json({ message: `Error al obtener comparativa trimestral: ${error.message}` });
  }
};

/**
 * Purga manual de datos anteriores a 3 meses
 */
export const runManualPrune = async (req, res) => {
  try {
    const result = await pruneOldPeachLogs(3);
    res.json({
      message: 'Purga trimestral ejecutada exitosamente',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: `Error en purga: ${error.message}` });
  }
};
