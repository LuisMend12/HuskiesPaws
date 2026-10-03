// Tools the agents may use. Everything an agent says comes from these results.
import { FETCH_TIMEOUT_MS, SCOUT_RADIUS_M } from "./config.js";

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function findNearbyPlaces(position) {
  const params = new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${position.lat}|${position.lon}`,
    gsradius: String(SCOUT_RADIUS_M),
    gslimit: "50",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
  const results = data?.query?.geosearch ?? [];
  return results.map((r) => ({ id: r.pageid, title: r.title, lat: r.lat, lon: r.lon }));
}

export async function getPlaceSummary(title) {
  const slug = encodeURIComponent(title.replaceAll(" ", "_"));
  const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  return {
    extract: data.extract ?? "",
    photo: data.thumbnail?.source ?? null,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`,
  };
}

// Which city/state/country you're in, for leaderboards. Nominatim allows at most
// one request per second, so call this once per session, not on every GPS update.
export async function getRegion(position, fallback) {
  try {
    const params = new URLSearchParams({
      format: "jsonv2", lat: String(position.lat), lon: String(position.lon), zoom: "10",
    });
    const data = await fetchJson(`https://nominatim.openstreetmap.org/reverse?${params}`);
    const address = data.address ?? {};
    return {
      local: address.city ?? address.town ?? address.village ?? address.county ?? fallback.local,
      state: address.state ?? fallback.state,
      national: address.country ?? fallback.national,
    };
  } catch (error) {
    console.warn("Region lookup failed, keeping previous region:", error);
    return fallback;
  }
}

// Walking route; falls back to a straight line if the routing server is unavailable.
export async function getWalkingRoute(from, to) {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const data = await fetchJson(url);
    const route = data.routes?.[0];
    if (!route) throw new Error("No route found");
    return {
      points: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
      distance: route.distance,
      approximate: false,
    };
  } catch (error) {
    console.warn("Routing unavailable, using straight line:", error);
    return { points: [from, to], distance: null, approximate: true };
  }
}
