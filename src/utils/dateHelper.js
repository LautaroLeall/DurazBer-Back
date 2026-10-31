/**
 * Utilidades de Fecha y Zona Horaria para DurazBer
 * Garantiza que el corte de día (00:00 a 23:59:59) ocurra exactamente en la medianoche
 * del usuario (por defecto UTC-3 Argentina = offset 180 minutos), sin importar si el
 * servidor en la nube (Render) corre en UTC.
 */

const DEFAULT_TZ_OFFSET_MINUTES = 180; // UTC-3 (Argentina / Uruguay / Brasil)

/**
 * Obtiene el offset en minutos desde el request (header x-timezone-offset o query)
 * En JS: new Date().getTimezoneOffset() devuelve 180 para UTC-3.
 */
export const getRequestTzOffset = (req) => {
  const headerVal = req?.headers?.['x-timezone-offset'] ?? req?.query?.tzOffset;
  if (headerVal !== undefined && headerVal !== null && headerVal !== '') {
    const parsed = Number(headerVal);
    if (!Number.isNaN(parsed) && parsed >= -840 && parsed <= 840) {
      return parsed;
    }
  }
  return DEFAULT_TZ_OFFSET_MINUTES;
};

/**
 * Convierte un objeto Date o timestamp en su clave de fecha local YYYY-MM-DD
 * según el tzOffsetMinutes indicado.
 */
export const toLocalDateKey = (dateInput = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) => {
  const ms = new Date(dateInput).getTime() - tzOffsetMinutes * 60 * 1000;
  const shifted = new Date(ms);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Devuelve las componentes locales { year, month, day, dayOfWeek } para una fecha dada
 */
export const getLocalParts = (dateInput = new Date(), tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) => {
  const ms = new Date(dateInput).getTime() - tzOffsetMinutes * 60 * 1000;
  const shifted = new Date(ms);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0-11
    day: shifted.getUTCDate(), // 1-31
    dayOfWeek: shifted.getUTCDay() // 0-6
  };
};

/**
 * Construye el rango exacto en UTC [start, end] para un día local específico (year, month 0-11, day)
 */
export const getLocalDayBoundsUTC = (year, month, day, tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) => {
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) + offsetMs);
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) + offsetMs);
  return { start, end };
};

/**
 * Devuelve el rango UTC [startOfDay, endOfDay] para el día de HOY en la zona horaria del usuario,
 * o de hace `daysAgo` días atrás.
 */
export const getRelativeLocalDayBoundsUTC = (daysAgo = 0, tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) => {
  const { year, month, day } = getLocalParts(new Date(), tzOffsetMinutes);
  const targetUTC = new Date(Date.UTC(year, month, day - daysAgo, 12, 0, 0, 0));
  return {
    ...getLocalDayBoundsUTC(
      targetUTC.getUTCFullYear(),
      targetUTC.getUTCMonth(),
      targetUTC.getUTCDate(),
      tzOffsetMinutes
    ),
    year: targetUTC.getUTCFullYear(),
    month: targetUTC.getUTCMonth(),
    day: targetUTC.getUTCDate(),
    dayOfWeek: targetUTC.getUTCDay(),
    dateKey: `${targetUTC.getUTCFullYear()}-${String(targetUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(targetUTC.getUTCDate()).padStart(2, '0')}`
  };
};

/**
 * Construye el rango UTC [monthStart, monthEnd] para un mes local relativo (monthsAgo = 0 actual, 1 anterior, etc.)
 */
export const getRelativeLocalMonthBoundsUTC = (monthsAgo = 0, tzOffsetMinutes = DEFAULT_TZ_OFFSET_MINUTES) => {
  const { year, month } = getLocalParts(new Date(), tzOffsetMinutes);
  const offsetMs = tzOffsetMinutes * 60 * 1000;

  const firstDayUTC = new Date(Date.UTC(year, month - monthsAgo, 1, 0, 0, 0, 0));
  const targetYear = firstDayUTC.getUTCFullYear();
  const targetMonth = firstDayUTC.getUTCMonth();

  const start = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0) + offsetMs);
  const end = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999) + offsetMs);

  return {
    start,
    end,
    year: targetYear,
    monthIndex: targetMonth
  };
};
