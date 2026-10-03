const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function pathLength(points) {
  return points.slice(1).reduce((total, point, i) => total + distanceMeters(points[i], point), 0);
}

export function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

export function walkingMinutes(meters, speedMps) {
  if (!(meters > 0) || !(speedMps > 0)) return 0;
  return Math.max(1, Math.round(meters / speedMps / 60));
}

// Small deterministic hash so a place always gets the same postcard colors.
export function hashString(text) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return hash;
}
