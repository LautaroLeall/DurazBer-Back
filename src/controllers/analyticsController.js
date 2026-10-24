import PeachLog from '../models/PeachLog.js';
import { pruneOldPeachLogs } from '../utils/cleanupService.js';

/**
 * Estadísticas reales de los últimos 7 días (Semanal)
 */
export const getWeeklyStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const today = new Date();
    const days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Construir los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setHours(23, 59, 59, 999);

      const dayLogs = await PeachLog.find({
        user: userId,
        date: { $gte: d, $lte: nextD }
      });

      const totalCount = dayLogs.reduce((acc, l) => acc + (l.peachesCount || 1), 0);
      const totalGrams = dayLogs.reduce((acc, l) => acc + (l.weightGrams || 150), 0);

      days.push({
        date: d.toISOString().split('T')[0],
        dayOfWeek: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        count: totalCount,
        grams: totalGrams,
        isToday: i === 0,
        metGoal: totalCount >= (req.user?.dailyGoal || 4)
      });
    }

    const totalWeekly = days.reduce((acc, d) => acc + d.count, 0);
    const avgDaily = +(totalWeekly / 7).toFixed(1);

    res.json({
      days,
      totalWeekly,
      avgDaily,
      dailyGoal: req.user?.dailyGoal || 4
    });
  } catch (error) {
    res.status(500).json({ message: `Error al calcular estadísticas semanales: ${error.message}` });
  }
};

/**
 * Comparativa real de los últimos 3 meses rodantes (Ventana de 3 meses)
 */
export const getThreeMonthComparative = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const now = new Date();
    const months = [];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Iterar estrictamente por los 3 meses: actual, anterior y hace 2 meses
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const logs = await PeachLog.find({
        user: userId,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const totalPeaches = logs.reduce((acc, l) => acc + (l.peachesCount || 1), 0);
      const totalWeightKg = +(logs.reduce((acc, l) => acc + (l.weightGrams || 150), 0) / 1000).toFixed(2);

      months.push({
        monthIndex: monthStart.getMonth(),
        monthName: monthNames[monthStart.getMonth()],
        year: monthStart.getFullYear(),
        label: `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
        totalPeaches,
        totalWeightKg,
        entriesCount: logs.length,
        isCurrentMonth: i === 0
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    res.json({
      retentionPolicy: {
        maxMonths: 3,
        description: 'Almacenamiento ultra-liviano: base de datos optimizada con purga automática cada 3 meses',
        cutoffDate: cutoffDate.toISOString().split('T')[0]
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
