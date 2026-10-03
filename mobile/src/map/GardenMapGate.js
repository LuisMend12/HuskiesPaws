import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, type } from "../theme.js";
import { StandardTrailMap } from "../components/StandardTrailMap.js";

export function GardenMapGate({ state, onOpenLandmark, onUserExplore }) {
  const [MapView, setMapView] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    import("./StylizedIosMap.js")
      .then((mod) => {
        if (live) setMapView(() => mod.default);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) {
    return (
      <>
        <StandardTrailMap state={state} onOpenLandmark={onOpenLandmark} />
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.text}>Garden map needs a development build. Showing the standard map.</Text>
        </View>
      </>
    );
  }

  if (!MapView) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return <MapView state={state} onOpenLandmark={onOpenLandmark} onUserExplore={onUserExplore} />;
}

const styles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#cfe8b8" },
  banner: {
    position: "absolute",
    top: 88,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 12,
  },
  text: { ...type.caption, textAlign: "center" },
});
