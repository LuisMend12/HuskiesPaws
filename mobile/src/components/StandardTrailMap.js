// Tilted Apple Maps (iOS) / Google Maps (Android) with blooms, routes, and pets.
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { DEFAULT_CENTER } from "../core/config.js";
import { distanceMeters } from "../core/geo.js";
import { YouMarker } from "./GameIcons.js";
import { colors } from "../theme.js";
import { petsView } from "./fakeData.js";
import { MapPets, useSettled } from "./MapPets.js";
import { landmarksView } from "./landmarks.js";
import { squadStatuses } from "./petStatus.js";

const TILT = 50;
const HEADING = 45; // turn the view 45° to the right
const ZOOM = 17;
const ALTITUDE = 600;
const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });
const BAG_LIFT_PX = 26;
const TAP_RADIUS_PX = 46;
const LANDMARK_ID = "landmark:";
const cameraAt = (p, meters = 0) => ({
  center: toCoord(p),
  pitch: TILT,
  heading: HEADING,
  zoom: meters > 450 ? ZOOM - 1.5 : meters > 200 ? ZOOM - 0.7 : ZOOM,
  altitude: Math.max(ALTITUDE, meters * 2.4),
});

function Bloom({ bloom }) {
  const tracking = useSettled();
  return (
    <Marker coordinate={toCoord(bloom)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracking}>
      <Text style={styles.bloom}>{bloom.emoji}</Text>
    </Marker>
  );
}

export function StandardTrailMap({ state, onOpenLandmark }) {
  const mapRef = useRef(null);
  const view = useRef({ height: 400, latitudeDelta: 0.006 });
  const { squad } = petsView(state);
  const landmarks = landmarksView(state);

  async function openNearestLandmark({ nativeEvent }) {
    if (!onOpenLandmark || landmarks.length === 0) return;
    const { coordinate, position } = nativeEvent;
    let best = null;
    if (position && (position.x || position.y) && mapRef.current) {
      const points = await Promise.all(
        landmarks.map((l) => mapRef.current.pointForCoordinate(toCoord(l)).catch(() => null)),
      );
      points.forEach((p, i) => {
        if (!p) return;
        const d = Math.hypot(p.x - position.x, p.y - BAG_LIFT_PX - position.y);
        if (d <= TAP_RADIUS_PX && (!best || d < best.d)) best = { d, landmark: landmarks[i] };
      });
    } else if (coordinate) {
      const metersPerPx = (view.current.latitudeDelta * 111320) / view.current.height;
      for (const l of landmarks) {
        const d = distanceMeters({ lat: coordinate.latitude, lon: coordinate.longitude }, l) / metersPerPx;
        if (d <= TAP_RADIUS_PX * 1.5 && (!best || d < best.d)) best = { d, landmark: l };
      }
    }
    if (best) onOpenLandmark(best.landmark.landmarkId);
  }

  useEffect(() => {
    if (!state.mapFocus) return;
    mapRef.current?.animateCamera(cameraAt(state.mapFocus), { duration: 600 });
  }, [state.mapFocus]);

  useEffect(() => {
    const trip = state.expedition;
    if (!trip) return;
    const middle = { lat: (trip.from.lat + trip.to.lat) / 2, lon: (trip.from.lon + trip.to.lon) / 2 };
    mapRef.current?.animateCamera(cameraAt(middle, distanceMeters(trip.from, trip.to)), { duration: 700 });
  }, [state.expedition]);

  useEffect(() => {
    if (!state.route || state.route.length < 2) return;
    mapRef.current?.fitToCoordinates(state.route.map(toCoord), {
      edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
      animated: true,
    });
  }, [state.route]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialCamera={cameraAt(DEFAULT_CENTER)}
      showsBuildings
      pitchEnabled
      showsPointsOfInterests={false}
      onLayout={(e) => {
        view.current.height = e.nativeEvent.layout.height;
      }}
      onRegionChangeComplete={(region) => {
        view.current.latitudeDelta = region.latitudeDelta;
      }}
      onPress={openNearestLandmark}
      onMarkerPress={(e) => {
        const id = e.nativeEvent.id ?? "";
        if (id.startsWith(LANDMARK_ID)) onOpenLandmark?.(id.slice(LANDMARK_ID.length));
      }}
    >
      {state.trailSegments.map((segment) => (
        <Polyline key={segment.id} coordinates={segment.coords} strokeColor={segment.color} strokeWidth={6} />
      ))}
      {state.route && (
        <Polyline coordinates={state.route.map(toCoord)} strokeColor={colors.accent} strokeWidth={4} lineDashPattern={[6, 8]} />
      )}
      {state.blooms.map((bloom) => (
        <Bloom key={`bloom-${bloom.id}`} bloom={bloom} />
      ))}
      <MapPets
        landmarkOpen={Boolean(state.landmarkOpen)}
        position={state.position}
        squad={squadStatuses(squad, state)}
        landmarks={landmarks}
        expedition={state.expedition}
        onOpenLandmark={onOpenLandmark}
      />
      <Marker coordinate={toCoord(state.position)} anchor={{ x: 0.5, y: 0.5 }} title="You" tracksViewChanges={false}>
        <View>
          <YouMarker size={28} />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  bloom: { fontSize: 16 },
});
