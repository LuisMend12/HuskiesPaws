// A 3D husky pup built from rounded blocks (Roblox simulator-pet style), drawn
// with React Three Fiber on expo-gl. Cartoon (toon) shading and dark outlines
// match the 2D PetSvg: same face, class accessory and rarity effects.
// STATUS: test. Shown only behind the dev-only "3D test" button in the Pets tab
// until it looks right on a real phone; then it replaces the hatch art.
/* eslint-disable react/no-unknown-property -- three.js elements (mesh, args, roughness...) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useMemo, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { BackSide, DataTexture, NearestFilter, RGBAFormat } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { colorOf, rarityOf } from "../core/pets.js";
import { colors, space, type } from "../theme.js";
import { Button } from "./ui.js";

const INK = colors.navy;
const OUTLINE = 1.07; // outline shell size relative to the part

// Three flat light bands, like cel shading.
function useToonRamp() {
  return useMemo(() => {
    const ramp = new DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, RGBAFormat);
    ramp.minFilter = NearestFilter;
    ramp.magFilter = NearestFilter;
    ramp.needsUpdate = true;
    return ramp;
  }, []);
}

// A part with a dark outline: the same shape, slightly bigger, drawn inside-out behind it.
function Outlined({ geometry, color, ramp, position, rotation, scale = 1, children }) {
  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={s.map((v) => v * OUTLINE)}>
        {geometry}
        <meshBasicMaterial color={INK} side={BackSide} />
      </mesh>
      <mesh scale={s}>
        {geometry}
        <meshToonMaterial color={color} gradientMap={ramp} />
      </mesh>
      {children}
    </group>
  );
}

// Flat layered discs facing forward: white, ice-blue iris, pupil, shine.
function Eye({ x }) {
  const disc = (r, color, z, y = 0, sx = 1) => (
    <mesh position={[0, y, z]} rotation={[Math.PI / 2, 0, 0]} scale={[sx, 1, 1.15]}>
      <cylinderGeometry args={[r, r, 0.02, 32]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
  return (
    <group position={[x, 0.1, 0.64]}>
      {disc(0.2, INK, 0)}
      {disc(0.175, "#ffffff", 0.012)}
      {disc(0.13, colors.ice, 0.024, -0.015)}
      {disc(0.07, INK, 0.036, -0.015)}
      {disc(0.045, "#ffffff", 0.048, 0.06, 0.9)}
    </group>
  );
}

function Face({ ramp }) {
  return (
    <group>
      {/* White husky mask, a flattened sphere on the front */}
      <mesh position={[0, -0.12, 0.5]} scale={[0.62, 0.48, 0.2]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshToonMaterial color="#ffffff" gradientMap={ramp} />
      </mesh>
      <Eye x={-0.3} />
      <Eye x={0.3} />
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.2, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1, 1]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
          <meshBasicMaterial color={colors.pink} />
        </mesh>
      ))}
      <mesh position={[0, -0.17, 0.71]} scale={[1.4, 0.9, 0.8]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {[-0.055, 0.055].map((x) => (
        <mesh key={x} position={[x, -0.25, 0.69]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.014, 8, 16, Math.PI]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      ))}
    </group>
  );
}

function Accessory({ petClass, ramp }) {
  if (petClass === "Scout") {
    return (
      <group position={[0.05, 0.78, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.26, 8]} />
          <meshToonMaterial color="#3f9d4a" gradientMap={ramp} />
        </mesh>
        <Outlined position={[0.16, 0.28, 0]} rotation={[0, 0, -0.5]} scale={[0.2, 0.08, 0.12]} ramp={ramp} color="#7cc96b" geometry={<sphereGeometry args={[1, 16, 12]} />} />
      </group>
    );
  }
  if (petClass === "Storyteller") {
    return (
      <Outlined position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]} ramp={ramp} color="#e53935" geometry={<torusGeometry args={[0.8, 0.1, 12, 40]} />} />
    );
  }
  if (petClass === "Pathfinder") {
    return (
      <group position={[0, 0.74, 0]}>
        <Outlined position={[0, -0.06, 0]} ramp={ramp} color="#c8a165" geometry={<cylinderGeometry args={[0.46, 0.46, 0.05, 32]} />} />
        <Outlined position={[0, 0.1, 0]} ramp={ramp} color="#d9b77e" geometry={<cylinderGeometry args={[0.26, 0.3, 0.28, 32]} />} />
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.305, 0.305, 0.07, 32]} />
          <meshBasicMaterial color="#8d6e3f" />
        </mesh>
      </group>
    );
  }
  if (petClass === "Guardian") {
    return (
      <group position={[0.78, -0.2, 0.42]} rotation={[0, 0.5, 0]}>
        <Outlined rotation={[Math.PI / 2, 0, 0]} ramp={ramp} color="#9aa5b1" geometry={<cylinderGeometry args={[0.3, 0.3, 0.08, 6]} />} />
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.07, 0.38, 0.02]} />
          <meshBasicMaterial color="#e8a317" />
        </mesh>
        <mesh position={[0, 0.04, 0.05]}>
          <boxGeometry args={[0.32, 0.07, 0.02]} />
          <meshBasicMaterial color="#e8a317" />
        </mesh>
      </group>
    );
  }
  return null;
}

function Pup({ pet }) {
  const ref = useRef(null);
  const ramp = useToonRamp();
  const fur = colorOf(pet).hex;
  const rarity = rarityOf(pet);
  const body = useMemo(() => <primitive object={new RoundedBoxGeometry(1.5, 1.25, 1.2, 6, 0.36)} attach="geometry" />, []);
  const foot = useMemo(() => <primitive object={new RoundedBoxGeometry(0.36, 0.26, 0.42, 3, 0.1)} attach="geometry" />, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.55; // turn side to side to show it's 3D
    ref.current.position.y = Math.abs(Math.sin(t * 2.4)) * 0.1; // little hops
  });

  return (
    <group>
      {/* Grassy stand and shadow */}
      <mesh position={[0, -0.98, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.22, 40]} />
        <meshToonMaterial color="#7cc96b" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, -0.865, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color={INK} transparent opacity={0.18} />
      </mesh>

      <group ref={ref}>
        <Outlined ramp={ramp} color={fur} geometry={body} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Outlined position={[side * 0.48, 0.82, 0]} rotation={[0, Math.PI / 4, side * -0.22]} ramp={ramp} color={fur} geometry={<coneGeometry args={[0.3, 0.55, 4]} />}>
              <mesh position={[0, -0.04, 0.12]} scale={[0.55, 0.7, 0.4]}>
                <coneGeometry args={[0.3, 0.55, 4]} />
                <meshBasicMaterial color={colors.pink} />
              </mesh>
            </Outlined>
            <Outlined position={[side * 0.4, -0.68, 0.24]} ramp={ramp} color={fur} geometry={foot} />
          </group>
        ))}
        <Face ramp={ramp} />
        <Accessory petClass={pet.petClass} ramp={ramp} />
        {rarity.id === "legendary" && (
          <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
            <torusGeometry args={[0.4, 0.06, 12, 40]} />
            <meshBasicMaterial color={rarity.color} />
          </mesh>
        )}
      </group>
    </group>
  );
}

export function Pet3D({ pet, size = 240 }) {
  return (
    <View style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0.9, 4.4], fov: 38 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.4} />
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
            <Pet3D pet={pet} size={300} />
            <Text style={[styles.label, { color: rarity.color }]}>{`${pet.name} · ${rarity.label} ${pet.petClass}`}</Text>
            <Text style={styles.hint}>Pass: it turns and hops smoothly. Fail: blank, frozen, choppy, or a crash.</Text>
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
