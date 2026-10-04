// First-run coach so judges (and new players) see the loop before tapping around.
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";
import { Button } from "./ui.js";

const STEPS = [
  { n: "1", t: "Explore", d: "Squad → your Scout → Explore." },
  { n: "2", t: "Walk", d: "Pick the place. Demo walks run themselves indoors." },
  { n: "3", t: "Collect", d: "Capture the landmark. Walking fills eggs." },
];

export function WelcomeOverlay({ visible, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade" accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="summary">
          <Image source={require("../../assets/splash-icon.png")} style={styles.mascot} accessibilityIgnoresInvertColors />
          <Text style={styles.title}>Walks become an adventure</Text>
          <Text style={styles.body}>Your squad finds real places, tells their stories, and walks you there. The green Next card always has the next tap.</Text>
          {STEPS.map((step) => (
            <View key={step.n} style={styles.row}>
              <View style={styles.badge}>
                <Text style={styles.n}>{step.n}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.step}>{step.t}</Text>
                <Text style={styles.detail}>{step.d}</Text>
              </View>
            </View>
          ))}
          <Button title="Let's walk" size="large" onPress={onDismiss} accessibilityLabel="Dismiss welcome and start walking" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 31, 58, 0.55)", justifyContent: "center", padding: space.lg },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.sheet,
    padding: space.xl,
    gap: space.md,
    ...shadow.raised,
  },
  mascot: { width: 88, height: 88, alignSelf: "center" },
  title: { ...type.title, textAlign: "center", fontSize: 22 },
  body: { ...type.body, textAlign: "center", color: colors.muted },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  n: { fontFamily: fonts.black, fontSize: 16, color: colors.white },
  flex: { flex: 1, gap: 2 },
  step: { ...type.label },
  detail: { ...type.caption },
});
