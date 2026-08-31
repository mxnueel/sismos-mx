const FEED_BASE = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";
const QUERY_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export const FEED_PERIODS = {
  hour: `${FEED_BASE}/all_hour.geojson`,
  day: `${FEED_BASE}/all_day.geojson`,
  week: `${FEED_BASE}/all_week.geojson`,
};

// Caja delimitadora que cubre el territorio y la costa de Mexico (incluye zonas
// sismicas de subduccion en el Pacifico donde ocurren muchos de los sismos que
// se sienten en el pais, aunque el epicentro caiga en aguas mexicanas).
export const MEXICO_BBOX = {
  minlatitude: 12,
  maxlatitude: 33,
  minlongitude: -119,
  maxlongitude: -85,
};

/** Descarga uno de los feeds globales pre-calculados de USGS (ultima hora/dia/semana). */
export async function fetchFeed(period) {
  const url = FEED_PERIODS[period];
  if (!url) throw new Error(`Periodo desconocido: ${period}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS respondio ${res.status} para el feed ${period}`);
  const data = await res.json();
  return data.features;
}

/** Consulta sismos dentro de una region y ventana de tiempo especificas (usado para el filtro "Mexico"). */
export async function queryRegion({ bbox = MEXICO_BBOX, startTime, endTime, minMagnitude = 0 } = {}) {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: startTime,
    endtime: endTime,
    minlatitude: String(bbox.minlatitude),
    maxlatitude: String(bbox.maxlatitude),
    minlongitude: String(bbox.minlongitude),
    maxlongitude: String(bbox.maxlongitude),
    minmagnitude: String(minMagnitude),
  });
  const res = await fetch(`${QUERY_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`USGS respondio ${res.status} para la consulta de region`);
  const data = await res.json();
  return data.features;
}
