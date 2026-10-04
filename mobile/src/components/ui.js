// Small shared UI pieces: buttons, chips, pill tabs, cards, section titles.
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";

// Shrinks a little while pressed, so taps feel physical.
function usePressScale() {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value) => Animated.spring(scale, { toValue: value, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  return { scale, onPressIn: () => to(0.95), onPressOut: () => to(1) };
}

// variant: "primary" (green) | "secondary" (white with a border); size: "normal" | "large"
export function Button({ title, onPress, disabled = false, variant = "primary", size = "normal", style, accessibilityLabel, icon }) {
  const press = usePressScale();
  const secondary = variant === "secondary";
  const large = size === "large";
  const ink = secondary ? colors.ink : colors.white;
  return (
    <Animated.View style={[{ transform: [{ scale: press.scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={({ pressed }) => [
          styles.button,
          large && styles.large,
          secondary ? styles.secondary : styles.primary,
          pressed && !disabled && (secondary ? styles.secondaryPressed : styles.primaryPressed),
          disabled && styles.disabled,
        ]}
      >
        {icon ? (
          <View style={styles.buttonRow}>
            {typeof icon === "function" ? icon({ color: ink, size: large ? 22 : 18 }) : icon}
            <Text style={[styles.buttonText, large && styles.largeText, secondary && styles.secondaryText]}>{title}</Text>
          </View>
        ) : (
          <Text style={[styles.buttonText, large && styles.largeText, secondary && styles.secondaryText]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
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

export function EmptyState({ emoji, icon, title, body }) {
  return (
    <View style={styles.emptyState}>
      {icon ?? (emoji ? <Text style={styles.emptyEmoji}>{emoji}</Text> : null)}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

// Sideways-scrolling pill tabs; the active one scrolls into view.
export function PillTabs({ tabs, active, onChange }) {
  const scrollRef = useRef(null);
  const offsets = useRef({});

  useEffect(() => {
    const x = offsets.current[active];
    if (x !== undefined) scrollRef.current?.scrollTo({ x: Math.max(0, x - space.xl), animated: true });
  }, [active]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsScroll}
      contentContainerStyle={styles.tabs}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onLayout={(event) => {
              offsets.current[tab.id] = event.nativeEvent.layout.x;
            }}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.tab, selected && styles.tabActive]}
          >
            {tab.Icon ? <tab.Icon size={16} color={selected ? colors.white : colors.muted} /> : null}
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>
              {tab.icon && !tab.Icon ? `${tab.icon} ${tab.label}` : tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Hint({ children, style }) {
  return <Text style={[styles.hint, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18, alignItems: "center", minHeight: 44, justifyContent: "center" },
  large: { paddingVertical: 15, paddingHorizontal: 26 },
  primary: { backgroundColor: colors.green },
  primaryPressed: { backgroundColor: colors.greenDark },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  secondaryPressed: { backgroundColor: colors.stripe },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  largeText: { fontFamily: fonts.extrabold, fontSize: 18 },
  secondaryText: { color: colors.ink },
  chip: { backgroundColor: colors.stripe, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: "center" },
  chipActive: { backgroundColor: colors.green, borderColor: colors.green },
  chipOutlined: { borderWidth: 2, borderColor: colors.green },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.white },
  tabsScroll: { flexGrow: 0 }, // a ScrollView grows to fill by default; the tab row shouldn't
  tabs: { alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tab: { borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  tabActive: { backgroundColor: colors.green },
  tabText: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted },
  tabTextActive: { color: colors.white },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: space.md, ...shadow.soft },
  sectionTitle: { ...type.heading, marginTop: space.lg, marginBottom: space.sm },
  hint: { ...type.caption },
  emptyState: {
    alignItems: "center",
    paddingVertical: space.xl,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  emptyEmoji: { fontSize: 36, lineHeight: 42 },
  emptyTitle: { ...type.heading, textAlign: "center" },
  emptyBody: { ...type.caption, textAlign: "center", maxWidth: 280 },
});
