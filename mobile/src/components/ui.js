// Small shared UI pieces: buttons, chips, section titles.
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme.js";

export function Button({ title, onPress, disabled = false, variant = "primary", style }) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        pressed && !disabled && (secondary ? styles.secondaryPressed : styles.primaryPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active = false, disabled = false, outlined = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive, outlined && !active && styles.chipOutlined, disabled && styles.disabled]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Hint({ children, style }) {
  return <Text style={[styles.hint, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 16, alignItems: "center" },
  primary: { backgroundColor: colors.leaf },
  primaryPressed: { backgroundColor: colors.leafDark },
  secondary: { backgroundColor: colors.soft },
  secondaryPressed: { backgroundColor: "#dfe9d9" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secondaryText: { color: colors.ink },
  chip: { backgroundColor: colors.soft, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.leafDark },
  chipOutlined: { borderWidth: 2, borderColor: colors.leaf },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginTop: 12, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.muted },
});
