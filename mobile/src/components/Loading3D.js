// Shown while a 3D screen's code loads (it's split out so the app starts fast).
// Without it, the first open looked frozen for a few seconds.
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { colors, type } from "../theme.js";

export function Loading3D({ label = "Loading 3D…" }) {
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11,31,58,0.6)", alignItems: "center", justifyContent: "center", gap: 12 },
  text: { ...type.label, color: colors.white },
});
