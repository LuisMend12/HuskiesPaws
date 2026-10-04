// Postcard a pet brings back from an expedition: a little scene of the place
// with the pet who found it (or the Grok Imagine picture, when there is one),
// the Wikipedia photo and fact, and the actions.
import { useState } from "react";
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { AGENTS } from "../core/agents.js";
import { hashString } from "../core/geo.js";
import { colors, fonts, radius, space, type } from "../theme.js";
import { PetSvg } from "./PetArt.js";
import { Button, Hint } from "./ui.js";

const SCENE_HEIGHT = 170;
const FACT_LINES = 5;

// Sky and hill colors, picked per place so every postcard looks a bit different.
const PALETTES = [
  { sky: ["#ffd8a8", "#ffb4a2"], hills: ["#a5d68f", "#5fa052"], sun: "#fff3c4" },
  { sky: ["#bde0fe", "#a2d2ff"], hills: ["#95d5b2", "#52b788"], sun: "#ffffff" },
  { sky: ["#e0c3fc", "#ffc8dd"], hills: ["#b7e4c7", "#74c69d"], sun: "#fff0f3" },
  { sky: ["#caf0f8", "#90e0ef"], hills: ["#a7c957", "#6a994e"], sun: "#fefae0" },
];

function Scene({ title, pet }) {
  const palette = PALETTES[hashString(title) % PALETTES.length];
  return (
    <View style={styles.scene}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.sky[0]} />
            <Stop offset="1" stopColor={palette.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="170" fill="url(#sky)" />
        <Circle cx="330" cy="46" r="26" fill={palette.sun} opacity={0.95} />
        <Path d="M0 112 Q100 66 200 108 T400 98 V170 H0 Z" fill={palette.hills[0]} />
        <Path d="M0 140 Q120 104 240 136 T400 132 V170 H0 Z" fill={palette.hills[1]} />
        <Path d="M250 170 Q232 146 262 128" stroke="#f1e3c6" strokeWidth={12} fill="none" strokeLinecap="round" />
      </Svg>
      {pet && (
        <View style={styles.scenePet}>
          <PetSvg pet={pet} size={104} />
        </View>
      )}
      <View style={styles.wish}>
        <Text style={styles.wishText}>Wish you were here! 🌸</Text>
      </View>
    </View>
  );
}

// pet: the pet who found the place (falls back to the old agent's name).
export function PostcardModal({ visible, discovery, pet, onClose, onGo, onReplay, demoMode = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!discovery) return null;
  const agent = AGENTS.find((a) => a.id === discovery.agentId);
  const finder = pet?.name ?? discovery.agentName ?? agent?.name ?? "your squad";
  const { place, summary } = discovery;
  const fact = summary.extract || "No description available.";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView>
            {discovery.image ? (
              <Image source={{ uri: discovery.image }} style={styles.scene} accessibilityLabel={`Illustration of ${place.title} by Grok Imagine`} />
            ) : (
              <Scene title={place.title} pet={pet} />
            )}
            <View style={styles.body}>
              <Text style={styles.from}>{`POSTCARD FROM ${finder.toUpperCase()}`}</Text>
              <Text style={type.title}>{place.title}</Text>
              {summary.photo && <Image source={{ uri: summary.photo }} style={styles.photo} accessibilityLabel={`Photo of ${place.title}`} />}
              <Text style={styles.fact} numberOfLines={expanded ? undefined : FACT_LINES}>{fact}</Text>
              {!expanded && fact.length > 220 && (
                <Text style={styles.more} onPress={() => setExpanded(true)} accessibilityRole="button">Read more</Text>
              )}
              <View style={styles.meta}>
                <Hint>{`${Math.round(place.distance)} m away`}</Hint>
                <Text style={styles.link} onPress={() => Linking.openURL(summary.url)} accessibilityRole="link">
                  Source: Wikipedia
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button title={demoMode ? "Start the walk" : "I'll walk there"} size="large" onPress={onGo} />
            <View style={styles.row}>
              <Button title="🔊 Replay" variant="secondary" onPress={onReplay} style={styles.half} />
              <Button title="Later" variant="secondary" onPress={onClose} style={styles.half} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11,31,58,0.55)", justifyContent: "center", padding: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.sheet, overflow: "hidden", maxHeight: "90%" },
  scene: { width: "100%", height: SCENE_HEIGHT, backgroundColor: colors.iceSoft },
  scenePet: { position: "absolute", left: 18, bottom: 10 },
  wish: { position: "absolute", right: 14, bottom: 14, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 12 },
  wishText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink },
  body: { padding: space.lg, gap: space.sm },
  from: { fontFamily: fonts.black, fontSize: 12, color: colors.muted, letterSpacing: 1.2 },
  photo: { width: "100%", height: 140, borderRadius: radius.small },
  fact: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink, lineHeight: 21 },
  more: { fontFamily: fonts.bold, fontSize: 14, color: colors.greenDark },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { fontFamily: fonts.bold, color: colors.greenDark, textDecorationLine: "underline", fontSize: 13 },
  actions: { gap: space.sm, padding: space.lg, paddingTop: space.xs },
  row: { flexDirection: "row", gap: space.sm },
  half: { flex: 1 },
});
