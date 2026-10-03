// Tools the agents may use. Everything an agent says comes from these results.
import { FETCH_TIMEOUT_MS, SCOUT_RADIUS_M } from "./config.js";

// Wikipedia and OpenStreetMap reject generic app User-Agents (React Native sends
// "okhttp" and gets 403). The mobile app sets an identifying one here; browsers
// must not, since a custom header would break CORS.
let requestHeaders = {};
export function setRequestHeaders(headers) {
  requestHeaders = { ...headers };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: requestHeaders });
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

// A bigger photo from a thumbnail URL by changing its "NNNpx-" part. Wikimedia
// only serves standard widths (960 and 1280 work; 1024 or 1080 return HTTP 400),
// so keep this one of those. Smaller originals are used as they are.
const PHOTO_LARGE_PX = 960;
export function largerPhoto(data, width = PHOTO_LARGE_PX) {
  const original = data.originalimage;
  const thumb = data.thumbnail?.source;
  if (!original) return thumb ?? null;
  if (original.width <= width || !thumb || !/\/\d+px-/.test(thumb)) return original.source;
  return thumb.replace(/\/\d+px-/, `/${width}px-`);
}

export async function getPlaceSummary(title) {
  const slug = encodeURIComponent(title.replaceAll(" ", "_"));
  const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  return {
    extract: data.extract ?? "",
    photo: data.thumbnail?.source ?? null, // small (~320 px): postcards, album
    photoLarge: largerPhoto(data), // ~960 px: full-screen backdrops
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

// Turns text like "Klarman Hall, Ithaca" into coordinates (OpenStreetMap Nominatim).
// Returns null when nothing matches.
export async function searchPlace(query, near) {
  const params = new URLSearchParams({ format: "jsonv2", q: query, limit: "1" });
  if (near) {
    // Prefer matches near the user's last known position (about 0.1° around it).
    const box = [near.lon - 0.1, near.lat + 0.1, near.lon + 0.1, near.lat - 0.1].join(",");
    params.set("viewbox", box);
  }
  const [match] = await fetchJson(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!match) return null;
  return { lat: Number(match.lat), lon: Number(match.lon), name: match.name || match.display_name };
}

// Live ISS position (wheretheiss.at, from NORAD orbital data). footprintKm is the
// diameter of the area on Earth that can see it.
export async function getIssPosition() {
  const data = await fetchJson("https://api.wheretheiss.at/v1/satellites/25544");
  return { lat: data.latitude, lon: data.longitude, footprintKm: data.footprint, visibility: data.visibility };
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
