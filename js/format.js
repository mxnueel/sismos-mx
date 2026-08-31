export function formatMagnitude(mag) {
  if (mag === null || mag === undefined || Number.isNaN(mag)) return "M ?";
  return `M ${mag.toFixed(1)}`;
}

/** Color del marcador segun magnitud, siguiendo convenciones comunes de mapas sismicos. */
export function magnitudeColor(mag) {
  if (mag === null || mag === undefined) return "#9e9e9e";
  if (mag < 3) return "#4caf50";
  if (mag < 4.5) return "#ffeb3b";
  if (mag < 6) return "#ff9800";
  return "#f44336";
}

/** Radio del marcador en pixeles, escalado para que los sismos grandes destaquen sin saturar el mapa. */
export function magnitudeRadius(mag) {
  if (mag === null || mag === undefined || mag < 0) return 4;
  return Math.max(4, mag * 3);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pluralize(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Tiempo relativo en espanol, ej. "hace 5 minutos". `now` es inyectable para pruebas deterministas. */
export function formatTimeAgo(timestampMs, now = Date.now()) {
  const diff = now - timestampMs;
  if (diff < 0) return "en el futuro";
  if (diff < MINUTE) return "hace unos segundos";
  if (diff < HOUR) return `hace ${pluralize(Math.floor(diff / MINUTE), "minuto", "minutos")}`;
  if (diff < DAY) return `hace ${pluralize(Math.floor(diff / HOUR), "hora", "horas")}`;
  return `hace ${pluralize(Math.floor(diff / DAY), "dia", "dias")}`;
}

export function filterByMinMagnitude(features, minMagnitude) {
  return features.filter((f) => (f.properties?.mag ?? -Infinity) >= minMagnitude);
}

export function sortByTimeDesc(features) {
  return [...features].sort((a, b) => (b.properties?.time ?? 0) - (a.properties?.time ?? 0));
}

export function sortByMagnitudeDesc(features) {
  return [...features].sort((a, b) => (b.properties?.mag ?? -Infinity) - (a.properties?.mag ?? -Infinity));
}
