// Validación de fecha de nacimiento compartida entre cliente y servidor.

// ¿Es año bisiesto?
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Días que tiene un mes (con el año para febrero)
function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

// Valida fecha de nacimiento en formato dd/mm/aaaa: día/mes/año reales y no futura
export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  if (year < 1) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthDate = new Date(year, month - 1, day);
  if (birthDate > startOfToday) return false;

  return true;
}

// Convierte dd/mm/aaaa a ISO yyyy-mm-dd, o null si no pasa la validación
export function birthDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = match[1];
  const month = match[2];
  const year = match[3];

  return `${year}-${month}-${day}`;
}