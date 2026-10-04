// One-line coach for the sheet: what to do next in the walk loop.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { nextStep } from "./nextCoach.js";
import { colors, fonts, radius, space } from "../theme.js";

export { followNext, nextStep } from "./nextCoach.js";

export function NextStepCard({ state, onPress }) {
  const step = nextStep(state);
  const tappable = Boolean(step.cta && onPress);
  return (
    <Pressable
      onPress={tappable ? onPress : undefined}
      disabled={!tappable}
      accessibilityRole={tappable ? "button" : "text"}
      accessibilityLabel={tappable ? `${step.title}. ${step.cta}` : step.title}
      accessibilityHint={tappable ? step.body : undefined}
      style={({ pressed }) => [styles.card, tappable && pressed && styles.pressed]}
    >
      <View style={styles.copy}>
        <Text style={styles.kicker}>Next</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>
      {tappable ? (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{step.cta}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.greenSoft,
    borderRadius: radius.small,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 44,
  },
  pressed: { opacity: 0.75 },
  copy: { flex: 1, gap: 2 },
  kicker: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 1, color: colors.greenDark, textTransform: "uppercase" },
  title: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.muted },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
  },
  ctaText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.white },
});
