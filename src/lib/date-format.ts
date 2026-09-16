// Formato de fechas del feed en la zona horaria de la guardería.
// La zona fija evita diferencias de render entre servidor y cliente (hidratación).
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

// Hora "HH:MM" (24h) en la zona de la guardería.
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso));
}

// Clave "YYYY-MM-DD" del día en la zona de la guardería (para agrupar el feed).
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso));
}

// Meses abreviados en español: fijos para no depender de los datos ICU del runtime.
const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

// Encabezado de día: HOY, AYER o "DD MMM" (p. ej. "17 JUN").
export function formatDayLabel(iso: string): string {
  const key = dayKey(iso);
  const todayKey = dayKey(new Date().toISOString());
  if (key === todayKey) return "HOY";

  // Ayer en la zona de la guardería: se resta un día sobre la clave de hoy.
  const [todayYear, todayMonth, todayDay] = todayKey.split("-").map(Number);
  const yesterdayKey = dayKey(new Date(Date.UTC(todayYear, todayMonth - 1, todayDay - 1, 12)).toISOString());
  if (key === yesterdayKey) return "AYER";

  const [, month, day] = key.split("-");
  return `${day} ${MONTHS_SHORT[Number(month) - 1]}`;
}

// Días de la semana en español: fijos por la misma razón que los meses.
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Fecha larga para la cabecera del feed: "martes 15 sep".
// Se calcula sobre la clave del día en la zona de la guardería y se formatea
// con arrays fijos para que servidor y cliente devuelvan el mismo texto.
export function formatLongDate(iso: string): string {
  const [year, month, day] = dayKey(iso).split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS_SHORT[month - 1].toLowerCase()}`;
}
