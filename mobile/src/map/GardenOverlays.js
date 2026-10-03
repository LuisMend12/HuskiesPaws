import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { colors } from "../theme.js";
import { routeCollection, trailCollection } from "./geojson.js";

export function GardenOverlays({ trailSegments, route }) {
  const trails = trailCollection(trailSegments);
  const planned = routeCollection(route);
  return (
    <>
      <GeoJSONSource id="huskies-trails" data={trails}>
        <Layer
          id="huskies-trails-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ["coalesce", ["get", "color"], colors.green],
            "line-width": 6,
            "line-opacity": 0.92,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="huskies-route" data={planned}>
        <Layer
          id="huskies-route-glow"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": "#fff4ea",
            "line-width": 8,
            "line-opacity": 0.85,
          }}
        />
        <Layer
          id="huskies-route-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": colors.accent,
            "line-width": 4,
            "line-dasharray": [1.6, 1.2],
          }}
        />
      </GeoJSONSource>
    </>
  );
}
