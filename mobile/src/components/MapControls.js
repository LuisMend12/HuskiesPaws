// Buttons that float over the map: brand and rank on top; one primary walk
// control, compact tools, and Capture when you're at a landmark.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RankBadge } from "./RankBadge.js";
import { canUseNativeMapLibre } from "../map/availability.js";
import { colors, fonts, radius, shadow, space } from "../theme.js";
import { CaptureIcon, GardenIcon, LiveIcon, MapGlyphIcon, PawIcon, RecenterIcon, WalkIcon } from "./GameIcons.js";
import { Button } from "./ui.js";
import { tapFeel } from "../feel.js";
import { walkHud } from "./nextCoach.js";

export const loadSquadView = () => import("./SquadView.js");
export const SHEET_OVERLAP = 24;

export function MapTopBar({ rank, score, boost = 1, issOverhead = false, onRankPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
      <View style={[styles.pill, styles.brand]} accessibilityRole="header">
        <Image source={require("../../assets/logo-badge.png")} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={styles.brandText}>
          Huskies<Text style={styles.brandAccent}>Paws</Text>
        </Text>
        {issOverhead ? <Text style={styles.issChip}>ISS</Text> : null}
      </View>
      <Pressable style={[styles.pill, styles.rankPill]} onPress={onRankPress} accessibilityRole="button" accessibilityLabel={`Your rank: ${rank.name}, ${score} XP${boost > 1 ? `, XP boost times ${boost.toFixed(1)}` : ""}`}>
        <RankBadge rank={rank} size={22} />
        <Text style={styles.pillText} numberOfLines={1}>
          {`${rank.name.split(" ")[0]} · ${score.toLocaleString()}`}
          {boost > 1 && <Text style={styles.boost}>{` ×${boost.toFixed(1)}`}</Text>}
        </Text>
      </Pressable>
    </View>
  );
}

function IconButton({ label, children, onPress, disabled, active, emphasis }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: Boolean(active) }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconBtn,
        emphasis && styles.iconBtnEmphasis,
        active && styles.iconBtnActive,
        disabled && styles.dim,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function usePulse(running) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!running) return undefined;
    let loop = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 700, useNativeDriver: true }),
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
  const busy = state.walking || state.planning;
  const live = state.liveLocation;
  const hud = walkHud(state);

  return (
    <View style={[styles.bottomBar, { bottom: SHEET_OVERLAP + space.sm }]} pointerEvents="box-none">
      {hud ? (
        <View style={styles.hud} accessibilityRole="text">
          <Text style={styles.hudText}>{hud}</Text>
        </View>
      ) : null}
      {canCapture && (
        <Animated.View style={[styles.capture, { transform: [{ scale: pulse }] }]}>
          <Button
            title={`Capture ${state.capturable.title}`}
            size="large"
            icon={({ color, size }) => <CaptureIcon size={size} color={color} />}
            onPress={() => { tapFeel(); game.set({ captureOpen: true }); }}
            style={shadow.raised}
            accessibilityLabel={`Capture ${state.capturable.title} for your album`}
          />
        </Animated.View>
      )}
      <View style={styles.tools}>
        {state.demoMode ? (
          <Button
            title={busy ? "Walking…" : "Practice walk"}
            icon={({ color, size }) => <WalkIcon size={size} color={color} />}
            onPress={game.demoWalk}
            disabled={busy}
            accessibilityLabel={busy ? "A practice walk is in progress" : "Start a practice walk nearby"}
          />
        ) : (
          <Button
            title={live ? "Walking live" : "Walk live"}
            icon={({ color, size }) => <LiveIcon size={size} color={live ? colors.white : color} />}
            onPress={game.startLiveLocation}
            disabled={live || busy}
            accessibilityLabel={live ? "Live location is on" : "Turn on live walking"}
          />
        )}
        <View style={styles.iconRow}>
          <IconButton label="See your squad in 3D" onPress={() => onSquadOpen(true)} emphasis>
            <PawIcon size={20} color={colors.white} />
          </IconButton>
          {gardenCapable && (
            <IconButton
              label={gardenOn ? "Switch to the standard map" : "Switch to the garden map"}
              onPress={() => game.setMapRenderer(gardenOn ? "standard" : "garden")}
              active={gardenOn}
            >
              {gardenOn ? <GardenIcon size={20} /> : <MapGlyphIcon size={20} />}
            </IconButton>
          )}
          <IconButton label="Center the map on me" onPress={recenter}>
            <RecenterIcon size={20} />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: "absolute", left: space.md, right: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 44,
    ...shadow.soft,
  },
  rankPill: { gap: 6, paddingLeft: 8, flexShrink: 1, maxWidth: "48%" },
  boost: { fontFamily: fonts.black, color: colors.gold },
  brand: { backgroundColor: colors.navy, paddingLeft: 4, gap: 6, flexShrink: 0 },
  logo: { width: 30, height: 30 },
  brandText: { fontFamily: fonts.black, fontSize: 15, color: colors.white },
  brandAccent: { color: colors.greenOnDark },
  issChip: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 1, color: colors.ice, marginLeft: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  bottomBar: { position: "absolute", left: space.md, right: space.md, gap: space.sm },
  hud: {
    alignSelf: "center",
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 16,
    ...shadow.soft,
  },
  hudText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  capture: { alignSelf: "stretch" },
  tools: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  iconBtnActive: { backgroundColor: colors.greenSoft },
  iconBtnEmphasis: { backgroundColor: colors.green },
  dim: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
