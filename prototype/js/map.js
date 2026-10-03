// Leaflet map: your position, blooming trail, discovered places, and routes.
/* global L */
import { BLOOM_EVERY_M, DEFAULT_ZOOM } from "./config.js";
import { distanceMeters } from "./geo.js";

const FLOWERS = ["🌸", "🌼", "🌷", "🌺", "🌻"];

export function createMap(elementId, center) {
  const map = L.map(elementId).setView([center.lat, center.lon], DEFAULT_ZOOM);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const me = L.circleMarker([center.lat, center.lon], {
    radius: 9, color: "#fff", weight: 3, fillColor: "#2e7d32", fillOpacity: 1,
  }).addTo(map);

  const trail = L.polyline([], { color: "#81c784", weight: 6, opacity: 0.6 }).addTo(map);
  const routeLayer = L.polyline([], { color: "#ff8a65", weight: 4, dashArray: "6 8" }).addTo(map);
  const placesLayer = L.layerGroup().addTo(map);

  let lastBloom = null;
  let bloomCount = 0;

  function moveTo(position) {
    const latLng = [position.lat, position.lon];
    me.setLatLng(latLng);
    trail.addLatLng(latLng);
    if (!lastBloom || distanceMeters(lastBloom, position) >= BLOOM_EVERY_M) {
      const flower = FLOWERS[bloomCount % FLOWERS.length];
      L.marker(latLng, {
        icon: L.divIcon({ className: "bloom", html: flower, iconSize: [16, 16] }),
        interactive: false,
      }).addTo(map);
      lastBloom = position;
      bloomCount += 1;
    }
    return bloomCount;
  }

  function addPlace(place, agentName) {
    L.marker([place.lat, place.lon])
      .bindTooltip(`${place.title} (found by ${agentName})`)
      .addTo(placesLayer);
  }

  function showRoute(points) {
    routeLayer.setLatLngs(points.map((p) => [p.lat, p.lon]));
    if (points.length > 1) map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
  }

  function recenter(position) {
    map.setView([position.lat, position.lon], DEFAULT_ZOOM);
  }

  return { moveTo, addPlace, showRoute, recenter };
}
