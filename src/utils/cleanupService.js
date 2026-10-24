import PeachLog from '../models/PeachLog.js';

/**
 * Servicio de retención rodante de datos para DurazBer.
 * Elimina automáticamente registros con más de 3 meses de antigüedad
 * para optimizar rendimiento y mantener la base de datos ligera.
 */
export const pruneOldPeachLogs = async (monthsToKeep = 3) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    cutoffDate.setHours(0, 0, 0, 0);

    const result = await PeachLog.deleteMany({
      date: { $lt: cutoffDate }
    });

    const totalRemaining = await PeachLog.countDocuments();

    console.log(`🧹 [DurazBer Prune Service] Registros anteriores a ${cutoffDate.toISOString().split('T')[0]} eliminados: ${result.deletedCount}`);
    console.log(`📊 [DurazBer Prune Service] Registros vigentes en los últimos ${monthsToKeep} meses: ${totalRemaining}`);

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate,
      remainingCount: totalRemaining
    };
  } catch (error) {
    console.error(`❌ [DurazBer Prune Service] Error en purga de datos antiguos: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Inicia el cron interno diario para verificar y purgar registros viejos.
 */
export const initRetentionScheduler = () => {
  // Ejecutar al arranque
  pruneOldPeachLogs(3);

  // Ejecutar cada 24 horas
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    pruneOldPeachLogs(3);
  }, ONE_DAY_MS);

  console.log(`⏰ [DurazBer] Tarea de mantenimiento programada: Purga automática de registros > 3 meses.`);
};
