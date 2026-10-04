// Buttons that float over the map: brand and rank on top; live location, demo
// walk, recenter, and the Capture button (only at a landmark) along the bottom.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { RankBadge } from "./RankBadge.js";
import { canUseNativeMapLibre } from "../map/availability.js";
import { colors, fonts, radius, shadow, space } from "../theme.js";
import { Button } from "./ui.js";

// The 3D squad view pulls in three.js, so it loads only when opened.
export const loadSquadView = () => import("./SquadView.js");

export const SHEET_OVERLAP = 24; // how far the sheet's rounded top covers the map

// boost: the XP multiplier from landmarks you hold (1 = none).
export function MapTopBar({ rank, score, boost = 1, onRankPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
      <View style={[styles.pill, styles.brand]} accessibilityRole="header">
        <Image source={require("../../assets/logo-badge.png")} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={styles.brandText}>
          Huskies<Text style={styles.brandAccent}>Paws</Text>
        </Text>
      </View>
      <Pressable style={[styles.pill, styles.rankPill]} onPress={onRankPress} accessibilityRole="button" accessibilityLabel={`Your rank: ${rank.name}, ${score} XP${boost > 1 ? `, XP boost times ${boost.toFixed(1)}` : ""}`}>
        <RankBadge rank={rank} size={22} />
        <Text style={styles.pillText}>
          {`${rank.name} · ${score.toLocaleString()} XP`}
          {boost > 1 && <Text style={styles.boost}>{` ×${boost.toFixed(1)}`}</Text>}
        </Text>
      </Pressable>
    </View>
  );
}

function RoundButton({ label, icon, onPress, disabled, active, round }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.pill, styles.action, round && styles.round, active && styles.actionActive, disabled && !active && styles.dim, pressed && styles.pressed]}
    >
      {typeof icon === "string" ? <Text style={[styles.pillText, active && styles.actionActiveText]}>{icon}</Text> : icon}
    </Pressable>
  );
}

function Crosshair() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.navy} strokeWidth={2.2} strokeLinecap="round">
      <Circle cx={12} cy={12} r={6.5} />
      <Circle cx={12} cy={12} r={2} fill={colors.navy} />
      <Path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
    </Svg>
  );
}

// A slow pulse so the Capture button is hard to miss (off with reduced motion).
function usePulse(running) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!running) return undefined;
    let loop = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.07, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      loop?.stop();
      scale.setValue(1);
    };
  }, [running, scale]);
  return scale;
}

export function MapControls({ state, game, onSquadOpen }) {
  const canCapture = Boolean(state.capturable) && !state.walking;
  const pulse = usePulse(canCapture);
  const recenter = () => game.set({ followCamera: true, mapFocus: { ...state.position, key: Date.now() } });
  const gardenCapable = canUseNativeMapLibre();
  const gardenOn = gardenCapable && state.mapRenderer === "garden";

  return (
    <View style={[styles.bottomBar, { bottom: SHEET_OVERLAP + space.md }]} pointerEvents="box-none">
      <View style={styles.row}>
        <RoundButton
          icon={state.liveLocation ? "📍 Live" : "📍 Go live"}
          label={state.liveLocation ? "Live location is on" : "Turn on live location"}
          onPress={game.startLiveLocation}
          disabled={state.liveLocation}
          active={state.liveLocation}
        />
        <RoundButton
          icon={state.walking || state.planning ? "🚶 Walking…" : "🚶 Demo walk"}
          label="Demo walk"
          onPress={game.demoWalk}
          disabled={state.walking || state.planning}
        />
      </View>
      <View style={styles.column}>
        <Pressable onPress={() => onSquadOpen(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="See your squad in 3D" style={({ pressed }) => [styles.paw, pressed && styles.pressed]}>
          <Text style={styles.pawIcon}>🐾</Text>
          <Text style={styles.pawLabel}>3D</Text>
        </Pressable>
        {gardenCapable && (
          <RoundButton
            icon={gardenOn ? "🌿 Garden" : "🗺️ Map"}
            label={gardenOn ? "Switch to the standard map" : "Switch to the garden map"}
            onPress={() => game.setMapRenderer(gardenOn ? "standard" : "garden")}
            active={gardenOn}
          />
        )}
        <RoundButton icon={<Crosshair />} label="Center the map on me" onPress={recenter} round />
      </View>
      {canCapture && (
        <Animated.View style={[styles.capture, { transform: [{ scale: pulse }] }]} pointerEvents="box-none">
          <Button
            title={`📸 Capture ${state.capturable.title}`}
            size="large"
            onPress={() => game.set({ captureOpen: true })}
            style={shadow.raised}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: "absolute", left: space.md, right: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...shadow.soft,
  },
  rankPill: { gap: 6, paddingLeft: 8 },
  boost: { fontFamily: fonts.black, color: "#e8a317" },
  brand: { backgroundColor: colors.navy, paddingLeft: 4, gap: 6 },
  logo: { width: 30, height: 30 },
  brandText: { fontFamily: fonts.black, fontSize: 16, color: colors.white },
  brandAccent: { color: colors.greenOnDark },
  pillText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  bottomBar: { position: "absolute", left: space.md, right: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  row: { flexDirection: "row", gap: space.sm },
  column: { alignItems: "center", gap: space.sm },
  paw: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, borderWidth: 3, borderColor: colors.white, alignItems: "center", justifyContent: "center", ...shadow.raised },
  pawIcon: { fontSize: 18, lineHeight: 20 },
  pawLabel: { fontFamily: fonts.black, fontSize: 10, color: colors.white, marginTop: -2 },
  action: { minHeight: 40 },
  round: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, justifyContent: "center" },
  actionActive: { backgroundColor: colors.greenSoft },
  actionActiveText: { color: colors.greenDark },
  dim: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
  capture: { position: "absolute", left: 0, right: 64, bottom: 56, alignItems: "center" }, // right: clear of the 3D and recenter buttons
});
