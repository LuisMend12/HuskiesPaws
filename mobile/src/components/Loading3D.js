// Shown while a 3D screen's code loads (it's split out so the app starts fast).
// A plain full-screen overlay, not a Modal: swapping one Modal for another on
// iOS (this one closing while the 3D screen's Modal opens) can leave the app stuck.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, type } from "../theme.js";

export function Loading3D({ label = "Loading 3D…" }) {
  return (
    <View style={styles.backdrop} pointerEvents="none">
      <ActivityIndicator size="large" color={colors.white} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: "rgba(11,31,58,0.6)", alignItems: "center", justifyContent: "center", gap: 12 },
  text: { ...type.label, color: colors.white },
});
