const empty = () => ({ type: "FeatureCollection", features: [] });

const line = (id, color, coords, extra = {}) => ({
  type: "Feature",
  properties: { id, color, ...extra },
  geometry: { type: "LineString", coordinates: coords },
});

export function trailCollection(segments) {
  if (!segments?.length) return empty();
  return {
    type: "FeatureCollection",
    features: segments
      .filter((segment) => segment.coords?.length > 1)
      .map((segment) =>
        line(
          segment.id,
          segment.color,
          segment.coords.map((c) => [c.longitude, c.latitude]),
        ),
      ),
  };
}

export function routeCollection(route) {
  if (!route || route.length < 2) return empty();
  return {
    type: "FeatureCollection",
    features: [line("route", "#ff7a59", route.map((p) => [p.lon, p.lat]))],
  };
}

export function boundsOf(points) {
  if (!points?.length) return null;
  let west = points[0].lon;
  let south = points[0].lat;
  let east = points[0].lon;
  let north = points[0].lat;
  points.forEach((p) => {
    west = Math.min(west, p.lon);
    south = Math.min(south, p.lat);
    east = Math.max(east, p.lon);
    north = Math.max(north, p.lat);
  });
  if (west === east) {
    west -= 0.001;
    east += 0.001;
  }
  if (south === north) {
    south -= 0.001;
    north += 0.001;
  }
  return [west, south, east, north];
}
