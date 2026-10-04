// 3D pets built from rounded blocks (Roblox simulator-pet style), drawn with
// React Three Fiber on expo-gl. Cartoon (toon) shading and dark outlines match
// the 2D PetSvg: same species, face, class accessory and rarity effects.
// Only loaded lazily (see SquadView.js): importing three must not happen at app start.
/* eslint-disable react/no-unknown-property -- three.js elements (mesh, args, roughness...) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { useFrame, useThree } from "@react-three/fiber/native";
import { useEffect, useRef } from "react";
import { BackSide, DataTexture, NearestFilter, RGBAFormat } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { colorOf, rarityOf } from "../core/pets.js";
import { colors } from "../theme.js";
import { diag } from "../diag.js";

export const INK = colors.navy;
const OUTLINE = 1.07; // outline shell size relative to the part

// Three flat light bands, like cel shading. One texture shared by every pet.
const RAMP = (() => {
  const ramp = new DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, RGBAFormat);
  ramp.minFilter = NearestFilter;
  ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
})();
const BODY = new RoundedBoxGeometry(1.5, 1.25, 1.2, 4, 0.36);
const FOOT = new RoundedBoxGeometry(0.36, 0.26, 0.42, 2, 0.1);

export const Toon = ({ color }) => <meshToonMaterial color={color} gradientMap={RAMP} />;
export const Flat = ({ color }) => <meshBasicMaterial color={color} />;

// On Expo every GL call runs on the JS thread, so drawing at 60 fps starved taps
// and the app felt frozen. Canvases use frameloop="demand" plus this ticker.
export const FPS_3D = 12;
export function FrameTicker({ fps = FPS_3D }) {
  const invalidate = useThree((state) => state.invalidate);
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
  });
  useEffect(() => {
    const timer = setInterval(() => invalidate(), 1000 / fps);
    const report = setInterval(() => diag(`3D drew ${frames.current} frames in the last 2 s`, (frames.current = 0) || ""), 2000);
    diag("3D view created");
    return () => {
      clearInterval(timer);
      clearInterval(report);
      diag("3D view removed");
    };
  }, [invalidate, fps]);
  return null;
}

// A part with a dark outline: the same shape, slightly bigger, drawn inside-out behind it.
export function Outlined({ geometry, color, position, rotation, scale = 1, children }) {
  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={s.map((v) => v * OUTLINE)}>
        {geometry}
        <meshBasicMaterial color={INK} side={BackSide} />
      </mesh>
      <mesh scale={s}>
        {geometry}
        <Toon color={color} />
      </mesh>
      {children}
    </group>
  );
}

// Flat layered discs facing forward: outline, white, ice-blue iris, pupil, shine.
function Eye({ x }) {
  const disc = (r, color, z, y = 0) => (
    <mesh position={[0, y, z]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.15]}>
      <cylinderGeometry args={[r, r, 0.02, 20]} />
      <Flat color={color} />
    </mesh>
  );
  return (
    <group position={[x, 0.1, 0.64]}>
      {disc(0.2, INK, 0)}
      {disc(0.175, "#ffffff", 0.012)}
      {disc(0.13, colors.ice, 0.024, -0.015)}
      {disc(0.07, INK, 0.036, -0.015)}
      {disc(0.045, "#ffffff", 0.048, 0.06)}
    </group>
  );
}

const cone = (r, h, sides = 4) => <coneGeometry args={[r, h, sides]} />;
const ball = <sphereGeometry args={[1, 16, 12]} />;

// Ears and face markings per species (same species as the 2D species.js).
function Ears({ species, fur }) {
  const pair = (render) => [-1, 1].map((side) => <group key={side}>{render(side)}</group>);
  switch (species) {
    case "shiba":
      return pair((side) => (
        <Outlined position={[side * 0.48, 0.78, 0]} rotation={[0, 0, side * -0.2]} color={fur} geometry={cone(0.32, 0.42, 8)}>
          <mesh position={[0, -0.04, 0.14]} scale={[0.55, 0.65, 0.4]}>{cone(0.32, 0.42, 8)}<Flat color="#fff3e0" /></mesh>
        </Outlined>
      ));
    case "cat":
      return pair((side) => (
        <Outlined position={[side * 0.52, 0.76, 0]} rotation={[0, Math.PI / 4, side * -0.35]} color={fur} geometry={cone(0.24, 0.4)}>
          <mesh position={[0, -0.03, 0.1]} scale={[0.5, 0.6, 0.4]}>{cone(0.24, 0.4)}<Flat color={colors.pink} /></mesh>
        </Outlined>
      ));
    case "bunny":
      return pair((side) => (
        <Outlined position={[side * 0.3, 1.12, 0]} rotation={[0, 0, side * -0.15]} scale={[0.15, 0.5, 0.11]} color={fur} geometry={ball}>
          <mesh position={[0, 0, 0.08]} scale={[0.07, 0.38, 0.05]}>{ball}<Flat color={colors.pink} /></mesh>
        </Outlined>
      ));
    case "fox":
      return pair((side) => (
        <Outlined position={[side * 0.5, 0.9, 0]} rotation={[0, Math.PI / 4, side * -0.25]} color={fur} geometry={cone(0.34, 0.7)}>
          <mesh position={[0, 0.26, 0]}>{cone(0.13, 0.2)}<Flat color={INK} /></mesh>
        </Outlined>
      ));
    case "bear":
      return pair((side) => (
        <Outlined position={[side * 0.56, 0.66, 0]} scale={0.22} color={fur} geometry={ball}>
          <mesh position={[0, 0, 0.18]} scale={[0.11, 0.11, 0.05]}>{ball}<Flat color={colors.pink} /></mesh>
        </Outlined>
      ));
    default: // husky
      return pair((side) => (
        <Outlined position={[side * 0.48, 0.82, 0]} rotation={[0, Math.PI / 4, side * -0.22]} color={fur} geometry={cone(0.3, 0.55)}>
          <mesh position={[0, -0.04, 0.12]} scale={[0.55, 0.7, 0.4]}>{cone(0.3, 0.55)}<Flat color={colors.pink} /></mesh>
        </Outlined>
      ));
  }
}

const MARKINGS = {
  husky: [{ color: "#ffffff", position: [0, -0.12, 0.5], scale: [0.62, 0.48, 0.2] }],
  shiba: [{ color: "#fff3e0", position: [0, -0.28, 0.48], scale: [0.6, 0.3, 0.2] }],
  cat: [{ color: "#ffffff", position: [0, -0.22, 0.56], scale: [0.24, 0.16, 0.12] }],
  bunny: [{ color: "#ffffff", position: [0, -0.22, 0.56], scale: [0.22, 0.16, 0.12] }],
  fox: [
    { color: "#ffffff", position: [-0.36, -0.28, 0.5], scale: [0.3, 0.22, 0.16] },
    { color: "#ffffff", position: [0.36, -0.28, 0.5], scale: [0.3, 0.22, 0.16] },
  ],
  bear: [{ color: "#f1d9b5", position: [0, -0.22, 0.54], scale: [0.32, 0.22, 0.14] }],
};

function Face({ species }) {
  return (
    <group>
      {(MARKINGS[species] ?? MARKINGS.husky).map((m, i) => (
        <mesh key={i} position={m.position} scale={m.scale}>
          {ball}
          <Toon color={m.color} />
        </mesh>
      ))}
      <Eye x={-0.3} />
      <Eye x={0.3} />
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.2, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1, 1]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
          <Flat color={colors.pink} />
        </mesh>
      ))}
      <mesh position={[0, -0.17, 0.71]} scale={[0.084, 0.054, 0.048]}>
        {ball}
        <Flat color={INK} />
      </mesh>
      {[-0.055, 0.055].map((x) => (
        <mesh key={x} position={[x, -0.25, 0.69]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.014, 6, 12, Math.PI]} />
          <Flat color={INK} />
        </mesh>
      ))}
    </group>
  );
}

function Accessory({ petClass }) {
  if (petClass === "Scout") {
    return (
      <group position={[0.05, 0.78, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.26, 6]} />
          <Toon color="#3f9d4a" />
        </mesh>
        <Outlined position={[0.16, 0.28, 0]} rotation={[0, 0, -0.5]} scale={[0.2, 0.08, 0.12]} color="#7cc96b" geometry={ball} />
      </group>
    );
  }
  if (petClass === "Storyteller") {
    return <Outlined position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]} color="#e53935" geometry={<torusGeometry args={[0.8, 0.1, 8, 28]} />} />;
  }
  if (petClass === "Pathfinder") {
    return (
      <group position={[0, 0.74, 0]}>
        <Outlined position={[0, -0.06, 0]} color="#c8a165" geometry={<cylinderGeometry args={[0.46, 0.46, 0.05, 24]} />} />
        <Outlined position={[0, 0.1, 0]} color="#d9b77e" geometry={<cylinderGeometry args={[0.26, 0.3, 0.28, 24]} />} />
        <mesh>
          <cylinderGeometry args={[0.305, 0.305, 0.07, 24]} />
          <Flat color="#8d6e3f" />
        </mesh>
      </group>
    );
  }
  if (petClass === "Guardian") {
    return (
      <group position={[0.78, -0.2, 0.42]} rotation={[0, 0.5, 0]}>
        <Outlined rotation={[Math.PI / 2, 0, 0]} color="#9aa5b1" geometry={<cylinderGeometry args={[0.3, 0.3, 0.08, 6]} />} />
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.07, 0.38, 0.02]} />
          <Flat color="#e8a317" />
        </mesh>
        <mesh position={[0, 0.04, 0.05]}>
          <boxGeometry args={[0.32, 0.07, 0.02]} />
          <Flat color="#e8a317" />
        </mesh>
      </group>
    );
  }
  return null;
}

// Wandering: each pet walks its own small triangle (x, z corners around its spot).
const TRIANGLE = [[0, 0.75], [0.7, -0.45], [-0.7, -0.45]];
const EDGES = TRIANGLE.map((a, i) => {
  const b = TRIANGLE[(i + 1) % TRIANGLE.length];
  return { a, dx: b[0] - a[0], dz: b[1] - a[1], length: Math.hypot(b[0] - a[0], b[1] - a[1]) };
});
const PERIMETER = EDGES.reduce((sum, e) => sum + e.length, 0);
const WALK_SPEED = 0.55; // units per second
const STEP_RATE = 9; // waddles per second (radians)

function alongTriangle(distance) {
  let d = ((distance % PERIMETER) + PERIMETER) % PERIMETER;
  for (const e of EDGES) {
    if (d <= e.length) return { x: e.a[0] + (e.dx * d) / e.length, z: e.a[1] + (e.dz * d) / e.length, dx: e.dx, dz: e.dz };
    d -= e.length;
  }
  return { x: TRIANGLE[0][0], z: TRIANGLE[0][1], dx: EDGES[0].dx, dz: EDGES[0].dz };
}

// Turns `from` toward `to` by at most `step` radians, the short way round.
function turnToward(from, to, step) {
  const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + Math.max(-step, Math.min(step, diff));
}

// One pet. `phase` offsets its motion so a group doesn't move in lockstep.
// wander: walk a small triangle (the shadow moves with it, so it stays grounded);
// otherwise stand in place and hop, looking around unless lookAround is false.
export function Pup({ pet, position = [0, 0, 0], phase = 0, turn = 0, wander = false, lookAround = true }) {
  const mover = useRef(null);
  const ref = useRef(null);
  const heading = useRef(turn);
  const fur = colorOf(pet).hex;
  const rarity = rarityOf(pet);
  const species = pet.species ?? "husky";

  useFrame(({ clock }, delta) => {
    if (!ref.current || !mover.current) return;
    const t = clock.getElapsedTime() + phase;
    if (wander) {
      const spot = alongTriangle(t * WALK_SPEED);
      mover.current.position.x = spot.x;
      mover.current.position.z = spot.z;
      heading.current = turnToward(heading.current, Math.atan2(spot.dx, spot.dz), delta * 5); // the model faces +z
      mover.current.rotation.y = heading.current;
      ref.current.rotation.y = 0;
      ref.current.rotation.z = Math.sin(t * STEP_RATE) * 0.08; // waddle
      ref.current.position.y = Math.abs(Math.sin(t * STEP_RATE)) * 0.06; // small steps, feet near the ground
      return;
    }
    ref.current.rotation.y = turn + (lookAround ? Math.sin(t * 0.8) * 0.45 : 0); // look around
    ref.current.position.y = Math.abs(Math.sin(t * 2.4)) * 0.12; // little hops
  });

  return (
    <group position={position}>
      <group ref={mover}>
        <mesh position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.75, 24]} />
          <meshBasicMaterial color={INK} transparent opacity={0.28} />
        </mesh>
        {rarity.id !== "common" && (
          <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.92, 32]} />
            <meshBasicMaterial color={rarity.color} transparent opacity={0.8} />
          </mesh>
        )}
        <group ref={ref}>
          <Outlined color={fur} geometry={<primitive object={BODY} attach="geometry" />} />
          <Ears species={species} fur={fur} />
          {[-1, 1].map((side) => (
            <Outlined key={side} position={[side * 0.4, -0.68, 0.24]} color={fur} geometry={<primitive object={FOOT} attach="geometry" />} />
          ))}
          <Face species={species} />
          <Accessory petClass={pet.petClass} />
          {rarity.id === "legendary" && (
            <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
              <torusGeometry args={[0.4, 0.06, 8, 32]} />
              <Flat color={rarity.color} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}
