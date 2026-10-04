// Map polylines. Cap length the same way flowers are capped, and skip points
// that are too close together so demo walks (10 ticks/s) do not copy thousands
// of coordinates into React state.
import { distanceMeters } from "../core/geo.js";

export const TRAIL_MIN_GAP_M = 8;
export const MAX_TRAIL_POINTS = 240;

const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });

export function trailPointCount(segments) {
  return segments.reduce((n, segment) => n + (segment.coords?.length ?? 0), 0);
}

export function trimTrail(segments, maxPoints = MAX_TRAIL_POINTS) {
  let extra = trailPointCount(segments) - maxPoints;
  if (extra <= 0) return segments;
  const next = segments.map((segment) => ({ ...segment, coords: [...segment.coords] }));
  for (const segment of next) {
    while (extra > 0 && segment.coords.length > 2) {
      segment.coords.shift();
      extra -= 1;
    }
  }
  const kept = next.filter((segment) => segment.coords.length >= 2);
  if (trailPointCount(kept) <= maxPoints) return kept;
  return kept.slice(-Math.max(1, Math.ceil(maxPoints / 2)));
}

export function extendTrail(segments, position, trail, {
  minGapM = TRAIL_MIN_GAP_M,
  maxPoints = MAX_TRAIL_POINTS,
} = {}) {
  const coord = toCoord(position);
  const last = segments.at(-1);
  if (last && last.trailId === trail.id) {
    const prev = last.coords.at(-1);
    if (prev && distanceMeters({ lat: prev.latitude, lon: prev.longitude }, position) < minGapM) {
      return segments;
    }
    return trimTrail(
      [...segments.slice(0, -1), { ...last, coords: [...last.coords, coord] }],
      maxPoints,
    );
  }
  const start = last ? [last.coords.at(-1), coord] : [coord];
  return trimTrail(
    [...segments, { id: `${segments.length}`, trailId: trail.id, color: trail.color, coords: start }],
    maxPoints,
  );
}
