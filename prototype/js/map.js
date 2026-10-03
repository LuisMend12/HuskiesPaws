// Mapbox map: your position, blooming trail, discovered places, and routes.
/* global mapboxgl */
import { BLOOM_EVERY_M, DEFAULT_ZOOM } from "./config.js";
import { distanceMeters } from "./geo.js";
import { load, save } from "./storage.js";

const STYLE = "mapbox://styles/mapbox/standard";
const ZOOM = DEFAULT_ZOOM - 1; // Mapbox zoom levels show one level more than Leaflet's
const PITCH = 45; // tilted view so 3D buildings and landmarks stand out

const toLngLat = (p) => [p.lon, p.lat];
const lineFeature = (coords, properties = {}) => ({
  type: "Feature",
  properties,
  geometry: { type: "LineString", coordinates: coords },
});

function dotElement(className, html = "") {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = html; // emoji from our own trail config, not user input
  return el;
}

// Without a token the map can't load, so ask for one in place of the map.
// Mapbox public tokens (pk.…) are meant for browser code; restrict yours to your URLs.
function showTokenForm(container) {
  const form = document.createElement("form");
  form.className = "map-token-form";
  form.innerHTML = `
    <p><strong>Add a Mapbox token to show the map.</strong><br>
    Copy your public token (starts with <code>pk.</code>) from your Mapbox account page.</p>
    <input type="text" autocomplete="off" placeholder="pk.…" aria-label="Mapbox access token">
    <button type="submit">Show map</button>`;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = form.querySelector("input").value.trim();
    if (!token) return;
    save("mapboxToken", token);
    location.reload();
  });
  container.append(form);
}

export function createMap(elementId, center, initialTrail) {
  const container = document.getElementById(elementId);
  // serve.py provides the token from .env; on other hosts, use the one pasted into the form.
  const token = window.WANDERLINGS_ENV?.MAPBOX_TOKEN || load("mapboxToken", "");
  let map = null;
  if (token && window.mapboxgl) {
    mapboxgl.accessToken = token;
    map = new mapboxgl.Map({
      container,
      style: STYLE,
      center: toLngLat(center),
      zoom: ZOOM,
      pitch: PITCH,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("error", (event) => console.warn("Mapbox error:", event.error));
  } else {
    showTokenForm(container);
  }

  // Lines are kept as data and drawn once the style has loaded.
  const trailSegments = [lineFeature([], { color: initialTrail.color })];
  let routeCoords = [];
  let ready = false;

  const me = map && new mapboxgl.Marker({ element: dotElement("me-dot") }).setLngLat(toLngLat(center)).addTo(map);

  function drawLines() {
    if (!ready) return;
    map.getSource("trail").setData({ type: "FeatureCollection", features: trailSegments });
    map.getSource("route").setData(lineFeature(routeCoords));
  }

  map?.on("load", () => {
    map.addSource("trail", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addSource("route", { type: "geojson", data: lineFeature([]) });
    map.addLayer({
      id: "trail",
      type: "line",
      source: "trail",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": ["get", "color"], "line-width": 6, "line-opacity": 0.6 },
    });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#ff8a65", "line-width": 4, "line-dasharray": [1.5, 2] },
    });
    ready = true;
    drawLines();
  });

  let trailStyle = initialTrail;
  let lastBloom = null;
  let bloomCount = 0;

  // Switching trails starts a new line segment; the old trail stays as it was walked.
  function setTrailStyle(style) {
    if (style.id === trailStyle.id) return;
    const last = trailSegments.at(-1).geometry.coordinates.at(-1);
    trailStyle = style;
    trailSegments.push(lineFeature(last ? [last] : [], { color: style.color }));
    drawLines();
  }

  function moveTo(position) {
    const lngLat = toLngLat(position);
    me?.setLngLat(lngLat);
    trailSegments.at(-1).geometry.coordinates.push(lngLat);
    drawLines();
    if (!lastBloom || distanceMeters(lastBloom, position) >= BLOOM_EVERY_M) {
      const flower = trailStyle.flowers[bloomCount % trailStyle.flowers.length];
      if (map) new mapboxgl.Marker({ element: dotElement("bloom", flower) }).setLngLat(lngLat).addTo(map);
      lastBloom = position;
      bloomCount += 1;
    }
    return bloomCount;
  }

  function addPlace(place, agentName) {
    if (!map) return;
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setText(`${place.title} (found by ${agentName})`);
    new mapboxgl.Marker({ color: "#2e7d32" }).setLngLat(toLngLat(place)).setPopup(popup).addTo(map);
  }

  function showRoute(points) {
    routeCoords = points.map(toLngLat);
    drawLines();
    if (map && points.length > 1) {
      const bounds = routeCoords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]));
      map.fitBounds(bounds, { padding: 40, pitch: PITCH });
    }
  }

  function recenter(position) {
    map?.easeTo({ center: toLngLat(position), zoom: ZOOM });
  }

  return { moveTo, addPlace, showRoute, recenter, setTrailStyle };
}
