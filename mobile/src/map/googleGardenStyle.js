// The garden palette as a Google Maps style, so the Android map in Expo Go
// (which can't load MapLibre) still looks like the garden map.
// Format: https://developers.google.com/maps/documentation/javascript/style-reference
import { GARDEN } from "./gardenStyle.js";

const rule = (featureType, elementType, color) => ({ featureType, elementType, stylers: [{ color }] });
const hidden = (featureType) => ({ featureType, stylers: [{ visibility: "off" }] });

export const GOOGLE_GARDEN_STYLE = [
  rule("landscape", "geometry", GARDEN.land),
  rule("landscape.natural.landcover", "geometry", GARDEN.grass),
  rule("landscape.natural.terrain", "geometry", GARDEN.wood),
  rule("landscape.man_made", "geometry", GARDEN.building),
  rule("poi.park", "geometry", GARDEN.park),
  rule("water", "geometry", GARDEN.water),
  rule("road", "geometry.fill", GARDEN.road),
  rule("road", "geometry.stroke", GARDEN.roadEdge),
  rule("all", "labels.text.fill", GARDEN.label),
  rule("all", "labels.text.stroke", GARDEN.halo),
  hidden("poi.business"),
  hidden("transit"),
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];
