// The latest status message, shown as a toast at the top of the map.
// Longer messages (Moss's stories) stay up longer; tap to dismiss.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, space, type } from "../theme.js";

const MIN_MS = 3500;
const MS_PER_CHAR = 45;
const MAX_MS = 9000;
const TOP_BAR_HEIGHT = 52; // below the floating brand and rank pills

export function StatusToast({ message }) {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(""); // the last message that finished hiding
  const [anim] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }));
  const timer = useRef(null);

  const hide = () => {
    clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setDismissed(message);
    });
  };

  useEffect(() => {
    if (!message) return undefined;
    AccessibilityInfo.announceForAccessibility(message);
    Animated.spring(anim, { toValue: 1, speed: 14, bounciness: 6, useNativeDriver: true }).start();
    clearTimeout(timer.current);
    timer.current = setTimeout(hide, Math.min(MAX_MS, MIN_MS + message.length * MS_PER_CHAR));
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only for a new message
  }, [message]);

  if (!message || message === dismissed) return null;
  return (
    <Animated.View style={[styles.wrap, { top: insets.top + TOP_BAR_HEIGHT, opacity: anim, transform: [{ translateY }] }]}>
      <Pressable onPress={hide} accessibilityRole="button" accessibilityHint="Dismisses this message" style={styles.toast}>
        <Text style={styles.text} numberOfLines={5}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: space.md, right: space.md },
  toast: { backgroundColor: colors.navy, borderRadius: radius.card, paddingVertical: space.md, paddingHorizontal: space.lg, ...shadow.raised },
  text: { ...type.body, color: colors.white },
});
