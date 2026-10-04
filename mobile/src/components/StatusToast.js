// The latest status message, shown as a toast at the top of the map.
// Shows two lines; tap to read all of it (it then stays until tapped again).
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, space, type } from "../theme.js";

const MIN_MS = 3500;
const MS_PER_CHAR = 45;
const MAX_MS = 9000;
const LONG_CHARS = 90; // about two lines on a phone
const TOP_BAR_HEIGHT = 52; // below the floating brand and rank pills

export function StatusToast({ message }) {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(""); // the last message that finished hiding
  const [expanded, setExpanded] = useState(""); // the message opened in full
  const [anim] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }));
  const timer = useRef(null);

  const hide = () => {
    clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setDismissed(message);
    });
  };

  const onPress = () => {
    if (expanded === message || message.length <= LONG_CHARS) return hide();
    clearTimeout(timer.current); // keep it open while reading
    return setExpanded(message);
  };

  useEffect(() => {
    if (!message) return undefined;
    AccessibilityInfo.announceForAccessibility(message.length > 120 ? message.slice(0, 80) : message);
    Animated.spring(anim, { toValue: 1, speed: 14, bounciness: 6, useNativeDriver: true }).start();
    clearTimeout(timer.current);
    timer.current = setTimeout(hide, Math.min(MAX_MS, MIN_MS + message.length * MS_PER_CHAR));
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only for a new message
  }, [message]);

  if (!message || message === dismissed) return null;
  const open = expanded === message;
  const long = message.length > LONG_CHARS;
  return (
    <Animated.View style={[styles.wrap, { top: insets.top + TOP_BAR_HEIGHT, opacity: anim, transform: [{ translateY }] }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={long && !open ? "Shows the whole message" : "Closes this message"}
        style={styles.toast}
      >
        <Text style={styles.text} numberOfLines={open ? undefined : 2}>{message}</Text>
        {long && <Text style={styles.more}>{open ? "Tap to close" : "Tap to read more"}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: space.md, right: space.md },
  toast: { backgroundColor: colors.navy, borderRadius: radius.card, paddingVertical: space.md, paddingHorizontal: space.lg, ...shadow.raised },
  text: { ...type.body, color: colors.white },
  more: { ...type.caption, color: colors.greenOnDark, marginTop: 2 },
});
