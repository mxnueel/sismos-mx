const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Distancia en km entre dos coordenadas (formula de Haversine). */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** true si el punto (lat, lon) cae dentro del radio (en km) de la zona {lat, lon, radiusKm}. */
export function isWithinZone(lat, lon, zone) {
  return distanceKm(lat, lon, zone.lat, zone.lon) <= zone.radiusKm;
}

/**
 * De una lista de sismos (features de USGS) y un conjunto de ids ya vistos,
 * regresa los que son nuevos Y caen dentro de la zona de alerta.
 */
export function findNewQuakesInZone(features, zone, seenIds) {
  return features.filter((f) => {
    if (seenIds.has(f.id)) return false;
    const [lon, lat] = f.geometry.coordinates;
    return isWithinZone(lat, lon, zone);
  });
}
