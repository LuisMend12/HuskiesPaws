// Full-screen 3D view of your squad (like Pikmin Bloom's world view): over the
// live camera (motion-sensor AR, see ArSquad.js) the pets stay put in the room
// and run to where you look; on the grassy field they walk little triangles. Opened from the 🐾 map button.
// Loaded lazily (it pulls in three.js), so it only costs anything when opened.
/* eslint-disable react/no-unknown-property -- three.js elements (lights, positions) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { Canvas, useThree } from "@react-three/fiber/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { rarityOf } from "../core/pets.js";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";
import { ArSquad } from "./ArSquad.js";
import { FrameTicker, Pup } from "./Pet3D.js";

const PET_SCALE = 0.7;
const SPACING = 2.7; // between pets, before scaling (room for each one's walking triangle)
const PET_WIDTH = 3.1; // one pet plus its walking triangle, before scaling

// Pets stand in a shallow arc facing you, the middle one a little forward.
function spotFor(i, count) {
  const x = (i - (count - 1) / 2) * SPACING;
  return [x, 0, -Math.abs(x) * 0.3];
}

// Moves the camera back until `width` world units fit across the screen, and
// looks down a little so things stand in the lower part, as if on the ground.
export function FitCamera({ width }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const halfWidthTan = Math.tan((camera.fov * Math.PI) / 360) * (size.width / size.height);
    const distance = Math.max(5.5, (width / 2 / halfWidthTan) * 1.2);
    camera.position.set(0, distance * 0.28, distance);
    camera.lookAt(0, distance * 0.16, 0);
    camera.updateProjectionMatrix();
  }, [camera, size, width]);
  return null;
}

const rowWidth = (count) => ((Math.max(1, count) - 1) * SPACING + PET_WIDTH) * PET_SCALE;

export function Field() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8fd3ff" />
          <Stop offset="1" stopColor="#e8f7ff" />
        </LinearGradient>
        <LinearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9ed98b" />
          <Stop offset="1" stopColor="#4caf50" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="55" fill="url(#sky)" />
      <Rect y="55" width="100" height="45" fill="url(#grass)" />
    </Svg>
  );
}

function Button({ label, onPress, active }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function SquadView({ visible, squad, onClose }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [ar, setAr] = useState(true);
  const pets = squad.slice(0, 5);
  const showCamera = ar && permission?.granted;

  const toggleAr = async () => {
    if (!ar) {
      if (!permission?.granted) await requestPermission();
      setAr(true);
      return;
    }
    setAr(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        {showCamera ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : <Field />}

        <Canvas
          style={StyleSheet.absoluteFill}
          gl={{ alpha: true }}
          camera={{ fov: 42 }}
          frameloop="demand"
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)} // see-through: the camera or field shows behind
        >
          <FrameTicker />
          <ambientLight intensity={1.1} />
          <directionalLight position={[2.5, 4, 3]} intensity={2.4} />
          {showCamera ? (
            // AR: the camera follows the phone; pets stay put in the room and regroup where you look.
            <ArSquad pets={pets} />
          ) : (
            <>
              <FitCamera width={rowWidth(pets.length)} />
              <group scale={PET_SCALE}>
                {pets.map((pet, i) => (
                  <Pup key={pet.id} pet={pet} position={spotFor(i, pets.length)} phase={i * 1.7} wander />
                ))}
              </group>
            </>
          )}
        </Canvas>

        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <Button label="✕ Close" onPress={onClose} />
          <Text style={styles.title}>Your squad</Text>
          <Button label={showCamera ? "🌳 Field" : "📷 AR"} onPress={toggleAr} active={showCamera} />
        </View>

        <View style={[styles.names, { paddingBottom: insets.bottom + space.lg }]}>
          {pets.length === 0 ? (
            <Text style={styles.empty}>Pick pets for your squad in the Pets tab.</Text>
          ) : (
            pets.map((pet) => (
              <View key={pet.id} style={styles.nameChip}>
                <Text style={styles.name} numberOfLines={1}>{pet.name}</Text>
                <Text style={[styles.rarity, { color: rarityOf(pet).color }]}>{rarityOf(pet).label}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.md },
  title: { ...type.heading, color: colors.white, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 6 },
  pill: { backgroundColor: colors.card, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14, ...shadow.soft },
  pillActive: { backgroundColor: colors.green },
  pillText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  pillTextActive: { color: colors.white },
  pressed: { opacity: 0.7 },
  names: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: space.sm, paddingHorizontal: space.md },
  nameChip: { backgroundColor: "rgba(255,255,255,0.92)", borderRadius: radius.card, paddingVertical: 6, paddingHorizontal: 12, alignItems: "center", ...shadow.soft },
  name: { ...type.label },
  rarity: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  empty: { ...type.label, color: colors.white, textAlign: "center" },
});
