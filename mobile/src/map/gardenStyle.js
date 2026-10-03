// OpenFreeMap Liberty (OpenMapTiles vector tiles). Free, no API key.
// Attribution is in the style JSON; MapLibre draws it automatically.
// https://openfreemap.org/  — required: OpenStreetMap / OpenMapTiles / OpenFreeMap

export const LIBERTY_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Shared with the Google Maps garden look (googleGardenStyle.js).
export const GARDEN = Object.freeze({
  land: "#cfe8b8",
  park: "#7bc86a",
  wood: "#5eaa62",
  grass: "#9ed67a",
  water: "#5eb7ef",
  road: "#f6f0dc",
  roadEdge: "#e4d4b2",
  building: "#f0ddb8",
  label: "#3d5a3a",
  halo: "#f7fbe9",
});
const { land: LAND, park: PARK, wood: WOOD, grass: GRASS, water: WATER } = GARDEN;
const { road: ROAD, roadEdge: ROAD_EDGE, building: BUILDING, label: LABEL, halo: HALO } = GARDEN;

const FILL = {
  background: LAND,
  park: PARK,
  landcover_wood: WOOD,
  landcover_grass: GRASS,
  landuse_pitch: PARK,
  landuse_cemetery: "#b7d99a",
  water: WATER,
  building: BUILDING,
};

const ROAD_FILL_IDS = [
  "road_minor",
  "road_service_track",
  "road_link",
  "road_secondary_tertiary",
  "road_trunk_primary",
  "road_motorway",
  "road_motorway_link",
  "bridge_street",
  "bridge_service_track",
  "bridge_link",
  "bridge_secondary_tertiary",
  "bridge_trunk_primary",
  "bridge_motorway",
  "bridge_motorway_link",
  "tunnel_minor",
  "tunnel_service_track",
  "tunnel_link",
  "tunnel_secondary_tertiary",
  "tunnel_trunk_primary",
  "tunnel_motorway",
  "tunnel_motorway_link",
];

const ROAD_CASE_IDS = [
  "road_minor_casing",
  "road_service_track_casing",
  "road_link_casing",
  "road_secondary_tertiary_casing",
  "road_trunk_primary_casing",
  "road_motorway_casing",
  "road_motorway_link_casing",
  "bridge_street_casing",
  "bridge_service_track_casing",
  "bridge_link_casing",
  "bridge_secondary_tertiary_casing",
  "bridge_trunk_primary_casing",
  "bridge_motorway_casing",
  "bridge_motorway_link_casing",
];

const HIDE = new Set([
  "natural_earth",
  "poi_r20",
  "poi_r7",
  "poi_r1",
  "poi_transit",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "airport",
  "label_other",
  "highway-name-path",
  "highway-name-minor",
]);

function paintOf(layer, key, value) {
  return { ...layer, paint: { ...(layer.paint || {}), [key]: value } };
}

function hide(layer) {
  return { ...layer, layout: { ...(layer.layout || {}), visibility: "none" } };
}

export function recastGardenStyle(style) {
  const layers = (style.layers || []).map((layer) => {
    let next = layer;
    if (HIDE.has(layer.id)) next = hide(next);
    if (layer.id === "background") next = paintOf(next, "background-color", LAND);
    if (FILL[layer.id] && layer.type === "fill") next = paintOf(next, "fill-color", FILL[layer.id]);
    if (layer.id === "park_outline") next = paintOf(next, "line-color", "#4e9a4a");
    if (layer.id === "waterway_river" || layer.id === "waterway_other") next = paintOf(next, "line-color", WATER);
    if (ROAD_FILL_IDS.includes(layer.id)) next = paintOf(next, "line-color", ROAD);
    if (ROAD_CASE_IDS.includes(layer.id)) next = paintOf(next, "line-color", ROAD_EDGE);
    if (layer.id === "building-3d") {
      next = paintOf(next, "fill-extrusion-color", BUILDING);
      next = paintOf(next, "fill-extrusion-opacity", 0.92);
    }
    if (layer.type === "symbol") {
      next = paintOf(next, "text-color", LABEL);
      next = paintOf(next, "text-halo-color", HALO);
    }
    return next;
  });
  return {
    ...style,
    name: "HuskiesPaws Garden",
    layers,
    metadata: { ...(style.metadata || {}), "huskiespaws:recast": true },
  };
}

export async function loadGardenStyle() {
  const response = await fetch(LIBERTY_STYLE_URL);
  if (!response.ok) throw new Error(`Map style HTTP ${response.status}`);
  return recastGardenStyle(await response.json());
}
