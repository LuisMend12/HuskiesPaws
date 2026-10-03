// A 3D husky pup built from rounded blocks (Roblox simulator-pet style), drawn
// with React Three Fiber on expo-gl. Same look as the 2D PetSvg.
// STATUS: test. Shown only behind the dev-only "3D test" button in the Pets tab
// until it's proven smooth on a real phone; then it replaces the hatch art.
/* eslint-disable react/no-unknown-property -- three.js elements (mesh, args, roughness...) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useMemo, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { colorOf, rarityOf } from "../core/pets.js";
import { colors, space, type } from "../theme.js";
import { Button } from "./ui.js";

const INK = colors.navy;

function Eye({ x }) {
  return (
    <group position={[x, 0.12, 0.6]}>
      <mesh scale={[1, 1.1, 0.5]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.01, 0.06]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color={colors.ice} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.01, 0.11]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color={INK} roughness={0.2} />
      </mesh>
      <mesh position={[-0.05, 0.05, 0.14]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Pup({ pet }) {
  const ref = useRef(null);
  const fur = colorOf(pet).hex;
  const body = useMemo(() => new RoundedBoxGeometry(1.5, 1.25, 1.2, 6, 0.32), []);
  const mask = useMemo(() => new RoundedBoxGeometry(0.95, 0.72, 0.08, 4, 0.03), []);
  const foot = useMemo(() => new RoundedBoxGeometry(0.34, 0.24, 0.4, 3, 0.08), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.6; // turn side to side to show it's 3D
    ref.current.position.y = Math.sin(t * 2.2) * 0.06; // bob
  });

  return (
    <group ref={ref}>
      <mesh geometry={body}>
        <meshStandardMaterial color={fur} roughness={0.55} />
      </mesh>
      <mesh geometry={mask} position={[0, -0.08, 0.6]}>
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <Eye x={-0.3} />
      <Eye x={0.3} />
      <mesh position={[0, -0.16, 0.68]} scale={[1.3, 0.8, 0.8]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.48, 0.82, 0]} rotation={[0, Math.PI / 4, side * -0.25]}>
            <coneGeometry args={[0.28, 0.5, 4]} />
            <meshStandardMaterial color={fur} roughness={0.55} flatShading />
          </mesh>
          <mesh position={[side * 0.4, -0.66, 0.25]} geometry={foot}>
            <meshStandardMaterial color={fur} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Pet3D({ pet, size = 240 }) {
  return (
    <View style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0.4, 3.6], fov: 40 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[2, 4, 3]} intensity={2.2} />
        <directionalLight position={[-3, 1, 2]} intensity={0.6} color={colors.ice} />
        <Pup pet={pet} />
      </Canvas>
    </View>
  );
}

export function Pet3DTest({ pet, onClose }) {
  const rarity = pet ? rarityOf(pet) : null;
  return (
    <Modal visible={Boolean(pet)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {pet && (
          <>
            <Text style={styles.title}>3D test</Text>
            <Pet3D pet={pet} size={280} />
            <Text style={[styles.label, { color: rarity.color }]}>{`${pet.name} · ${rarity.label}`}</Text>
            <Text style={styles.hint}>Pass: it turns and bobs smoothly. Fail: blank, frozen, choppy, or a crash.</Text>
            <Button title="Close" onPress={onClose} />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11,31,58,0.92)", alignItems: "center", justifyContent: "center", gap: space.md, padding: space.xl },
  title: { ...type.title, color: colors.white },
  label: { ...type.heading },
  hint: { ...type.caption, color: colors.iceSoft, textAlign: "center" },
});
