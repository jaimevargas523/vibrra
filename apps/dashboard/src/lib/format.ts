/**
 * Format a number as Colombian Pesos (COP).
 * Example: 125000 -> "$125.000"
 * @deprecated Use formatCurrency() or useCurrencyFormatter() instead.
 */
export function formatCOP(n: number): string {
  const rounded = Math.round(n);
  const formatted = rounded.toLocaleString("es-CO", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `$${formatted}`;
}

/**
 * Format a number in the given currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 * Example: formatCurrency(125000, { symbol: "$", locale: "es-CO" }) -> "$125.000"
 */
export function formatCurrency(
  n: number,
  moneda?: { symbol: string; locale: string },
): string {
  const symbol = moneda?.symbol ?? "$";
  const locale = moneda?.locale ?? "es-CO";
  const rounded = Math.round(n);
  const formatted = rounded.toLocaleString(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}

/**
 * Format a duration in minutes to a human-readable string.
 * Example: 150 -> "2h 30min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "0min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Format a live duration from a start time as HH:MM:SS.
 * Example: "01:23:45"
 */
export function formatDurationLive(startTime: Date): string {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startTime.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

/**
 * Get a greeting based on the current hour.
 * "Buenos dias", "Buenas tardes", "Buenas noches"
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos dias";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Format a date as relative time in Spanish.
 * Example: "Hace 5 min", "Hace 2 horas", "Hace 3 dias"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} dia${diffDays > 1 ? "s" : ""}`;

  return formatDate(date);
}

/**
 * Format a date in Spanish long format.
 * Example: "Viernes 28 de febrero, 2026"
 */
export function formatDate(date: Date): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ];
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${dayNum} de ${monthName}, ${year}`;
}

/**
 * Format a short date: "28 feb 2026"
 */
export function formatShortDate(date: Date): string {
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format time: "14:30"
 */
export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
