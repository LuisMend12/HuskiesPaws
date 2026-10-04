// One-line coach for the sheet: what to do next in the walk loop.
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme.js";

export function nextStep(state) {
  if (state.hatching) {
    return { title: "Your egg hatched", body: `Meet ${state.hatching.name}!` };
  }
  if (state.capturable && !state.walking) {
    return { title: "Capture this place", body: `Save ${state.capturable.title} to your album.` };
  }
  if (state.planning) {
    return { title: "Planning a route", body: "Hang on — a path is being drawn." };
  }
  if (state.walking) {
    return { title: state.demoMode ? "Practice walk" : "On the trail", body: "Flowers bloom along the path as you go." };
  }
  if (state.guide) {
    return { title: "Walk there", body: `Head to ${state.guide.place.title}. We'll cheer when you arrive.` };
  }
  if (state.discovery) {
    return { title: "A place is waiting", body: `Walk to ${state.discovery.place.title}, then capture it.` };
  }
  if (state.away?.length) {
    return { title: "Exploring", body: "Your scout is looking for somewhere new." };
  }
  if (!state.progress.landmarksFound) {
    return { title: "Find a place", body: "Open Squad and tap Explore on your Scout." };
  }
  return { title: "Keep exploring", body: "Tap a landmark on the map, walk there, and capture it." };
}

export function NextStepCard({ state }) {
  const step = nextStep(state);
  return (
    <View style={styles.card} accessibilityRole="text">
      <Text style={styles.kicker}>Next</Text>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.body}>{step.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.greenSoft,
    borderRadius: radius.small,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    gap: 2,
  },
  kicker: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 1, color: colors.greenDark, textTransform: "uppercase" },
  title: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.muted },
});
