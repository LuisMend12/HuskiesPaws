import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Camera, Map } from "@maplibre/maplibre-react-native";
import { DEFAULT_CENTER } from "../core/config.js";
import { distanceMeters } from "../core/geo.js";
import { colors, fonts, space, type } from "../theme.js";
import { GardenMarkers } from "./GardenMarkers.js";
import { GardenOverlays } from "./GardenOverlays.js";
import { LIBERTY_STYLE_URL, loadGardenStyle } from "./gardenStyle.js";
import { boundsOf } from "./geojson.js";

const PITCH = 56;
const ZOOM = 16.15;
const toLngLat = (p) => [p.lon, p.lat];

function cameraFor(point, meters = 0) {
  const zoom = meters > 450 ? 14.6 : meters > 200 ? 15.3 : ZOOM;
  return { center: toLngLat(point), zoom, pitch: PITCH, bearing: 0, duration: 650, easing: "ease" };
}

export default function StylizedIosMap({ state, onOpenLandmark, onUserExplore }) {
  const cameraRef = useRef(null);
  const [styleJson, setStyleJson] = useState(null);
  const [styleError, setStyleError] = useState("");
  const [styleReady, setStyleReady] = useState(false);
  const previewingRoute = Boolean(state.route?.length >= 2 && !state.walking);
  const follow = state.followCamera !== false && !state.expedition && !previewingRoute;

  useEffect(() => {
    let live = true;
    loadGardenStyle()
      .then((style) => {
        if (live) setStyleJson(style);
      })
      .catch((error) => {
        if (live) setStyleError(error.message || "Could not load the garden map style.");
      });
    return () => {
      live = false;
    };
  }, []);

  const playerLat = state.position.lat;
  const playerLon = state.position.lon;

  useEffect(() => {
    if (!follow || !styleReady) return;
    cameraRef.current?.easeTo(cameraFor({ lat: playerLat, lon: playerLon }));
  }, [follow, styleReady, playerLat, playerLon]);

  useEffect(() => {
    if (!state.mapFocus || !styleReady) return;
    cameraRef.current?.easeTo(cameraFor(state.mapFocus));
  }, [state.mapFocus, styleReady]);

  useEffect(() => {
    const trip = state.expedition;
    if (!trip || !styleReady) return;
    const middle = { lat: (trip.from.lat + trip.to.lat) / 2, lon: (trip.from.lon + trip.to.lon) / 2 };
    cameraRef.current?.easeTo(cameraFor(middle, distanceMeters(trip.from, trip.to)));
  }, [state.expedition, styleReady]);

  useEffect(() => {
    if (!state.route || state.route.length < 2 || !styleReady) return;
    const box = boundsOf(state.route);
    if (!box) return;
    cameraRef.current?.fitBounds(box, { padding: { top: 80, right: 56, bottom: 120, left: 56 }, pitch: PITCH, duration: 700 });
  }, [state.route, styleReady]);

  const mapStyle = styleJson || (styleError ? LIBERTY_STYLE_URL : null);

  if (!mapStyle) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.loading]}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.bannerText}>Growing the garden map…</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        attribution
        attributionPosition={{ bottom: 8, left: 8 }}
        compass
        compassPosition={{ top: 72, right: 8 }}
        scaleBar={false}
        preferredFramesPerSecond={30}
        onDidFinishLoadingMap={() => setStyleReady(true)}
        onDidFailLoadingMap={() => setStyleError("The garden map failed to load. Check the network, or switch to the standard map.")}
        onRegionDidChange={(event) => {
          if (event.nativeEvent?.userInteraction) onUserExplore?.();
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: toLngLat(state.position || DEFAULT_CENTER),
            zoom: ZOOM,
            pitch: PITCH,
            bearing: 0,
          }}
          minZoom={3}
          maxZoom={18}
        />
        <GardenOverlays trailSegments={state.trailSegments} route={state.route} />
        <GardenMarkers state={state} onOpenLandmark={onOpenLandmark} />
      </Map>
      {!styleReady && !styleError && (
        <View style={styles.banner} pointerEvents="none">
          <ActivityIndicator color={colors.green} />
          <Text style={styles.bannerText}>Drawing the garden…</Text>
        </View>
      )}
      {Boolean(styleError) && (
        <View style={styles.banner}>
          <Text style={styles.errorTitle}>Garden map unavailable</Text>
          <Text style={styles.bannerText}>{styleError}</Text>
        </View>
      )}
      <Text style={styles.credit} pointerEvents="none">
        OpenFreeMap · OpenMapTiles · OpenStreetMap
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", justifyContent: "center", backgroundColor: "#cfe8b8", gap: 8 },
  banner: {
    position: "absolute",
    top: 88,
    left: space.md,
    right: space.md,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: space.md,
    gap: 6,
    alignItems: "center",
  },
  bannerText: { ...type.caption, textAlign: "center" },
  errorTitle: { fontFamily: fonts.black, color: colors.ink, fontSize: 14 },
  credit: {
    position: "absolute",
    left: 44,
    bottom: 10,
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.muted,
  },
});
