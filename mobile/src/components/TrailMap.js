// Tilted map with your blooming trail, flowers, the planned route, found
// places, and pets: your squad following you and guards on landmarks.
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { DEFAULT_CENTER } from "../core/config.js";
import { colors } from "../theme.js";
import { petsView } from "./fakeData.js";
import { MapPets, useSettled } from "./MapPets.js";

const TILT = 50; // degrees; makes standing pets and 3D buildings read as 3D
const ZOOM = 17; // Google Maps (Android)
const ALTITUDE = 600; // meters; Apple Maps (iOS) uses this instead of zoom
const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });
const cameraAt = (p) => ({ center: toCoord(p), pitch: TILT, heading: 0, zoom: ZOOM, altitude: ALTITUDE });

function Bloom({ bloom }) {
  const tracking = useSettled();
  return (
    <Marker coordinate={toCoord(bloom)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracking}>
      <Text style={styles.bloom}>{bloom.emoji}</Text>
    </Marker>
  );
}

export function TrailMap({ state }) {
  const mapRef = useRef(null);
  const { squad, turf } = petsView(state);

  useEffect(() => {
    if (!state.mapFocus) return;
    mapRef.current?.animateCamera(cameraAt(state.mapFocus), { duration: 600 });
  }, [state.mapFocus]);

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
      {state.found.map((place) => (
        <Marker key={`place-${place.id}`} coordinate={toCoord(place)} title={place.title} description="Found by your squad" />
      ))}
      <MapPets position={state.position} squad={squad} turf={turf} />
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
