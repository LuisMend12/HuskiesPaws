// Map with your blooming trail, flowers, the planned route, and found places.
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { DEFAULT_CENTER } from "../core/config.js";
import { colors } from "../theme.js";

const ZOOM_DELTA = 0.006; // about a campus-sized view
const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });

export function TrailMap({ state }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!state.mapFocus) return;
    mapRef.current?.animateToRegion(
      { ...toCoord(state.mapFocus), latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA },
      600,
    );
  }, [state.mapFocus]);

  useEffect(() => {
    if (!state.route || state.route.length < 2) return;
    mapRef.current?.fitToCoordinates(state.route.map(toCoord), {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [state.route]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...toCoord(DEFAULT_CENTER), latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
      showsPointsOfInterests={false}
    >
      {state.trailSegments.map((segment) => (
        <Polyline key={segment.id} coordinates={segment.coords} strokeColor={segment.color} strokeWidth={6} />
      ))}
      {state.route && (
        <Polyline coordinates={state.route.map(toCoord)} strokeColor={colors.accent} strokeWidth={4} lineDashPattern={[6, 8]} />
      )}
      {state.blooms.map((bloom) => (
        <Marker key={`bloom-${bloom.id}`} coordinate={toCoord(bloom)} anchor={{ x: 0.5, y: 0.5 }}>
          <Text style={styles.bloom}>{bloom.emoji}</Text>
        </Marker>
      ))}
      {state.found.map((place) => (
        <Marker key={`place-${place.id}`} coordinate={toCoord(place)} title={place.title} description="Found by your squad" />
      ))}
      <Marker coordinate={toCoord(state.position)} anchor={{ x: 0.5, y: 0.5 }} title="You">
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
