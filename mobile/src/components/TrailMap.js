// Tilted map with your blooming trail, flowers, the planned route, found
// places, and pets: your squad following you and guards on landmarks.
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { DEFAULT_CENTER } from "../core/config.js";
import { distanceMeters } from "../core/geo.js";
import { colors } from "../theme.js";
import { petsView } from "./fakeData.js";
import { MapPets, useSettled } from "./MapPets.js";
import { landmarksView } from "./landmarks.js";
import { squadStatuses } from "./petStatus.js";

const TILT = 50; // degrees; makes standing pets and 3D buildings read as 3D
const ZOOM = 17; // Google Maps (Android)
const ALTITUDE = 600; // meters; Apple Maps (iOS) uses this instead of zoom
const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });
const cameraAt = (p, meters = 0) => ({
  center: toCoord(p),
  pitch: TILT,
  heading: 0,
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

// onOpenLandmark(id): called when a landmark's food bag is tapped.
export function TrailMap({ state, onOpenLandmark }) {
  const mapRef = useRef(null);
  const { squad } = petsView(state);

  useEffect(() => {
    if (!state.mapFocus) return;
    mapRef.current?.animateCamera(cameraAt(state.mapFocus), { duration: 600 });
  }, [state.mapFocus]);

  // Pull back so you can watch the exploring pet walk to its place.
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
        position={state.position}
        squad={squadStatuses(squad, state)}
        landmarks={landmarksView(state)}
        expedition={state.expedition}
        onOpenLandmark={onOpenLandmark}
      />
      <Marker coordinate={toCoord(state.position)} anchor={{ x: 0.5, y: 0.5 }} title="You" tracksViewChanges={false}>
        <View style={styles.me} />
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  bloom: { fontSize: 16 },
  me: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.leafDark,
    borderWidth: 3,
    borderColor: "#fff",
  },
});
