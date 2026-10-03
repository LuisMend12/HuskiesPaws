// 3D landmark pieces: the food every landmark has (a dog-food bag, a can of
// tuna or a jar of treats), the ring under it,
// the guard pet beside it, and the head-bashing battle when you challenge it.
// Loaded lazily with LandmarkView.js (three.js must not load at app start).
/* eslint-disable react/no-unknown-property -- three.js elements (mesh, args...) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { useFrame } from "@react-three/fiber/native";
import { useRef } from "react";
import { BackSide } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { colors } from "../theme.js";
import { Flat, Outlined, Pup, Toon } from "./Pet3D.js";

const GROUND = -0.86; // where pets' feet are
const BAG = new RoundedBoxGeometry(0.9, 1.2, 0.5, 3, 0.12);
const OUTLINE_JAR = [1.05, 1.03, 1.05];

export const RING_COLORS = Object.freeze({ free: "#aab4bf", mine: colors.green, rival: colors.coral });

const disc = (r, position, color) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[r, r, 0.02, 16]} />
    <Flat color={color} />
  </mesh>
);

// The ring every landmark's food stands on, and its soft shadow.
function Ring({ ring }) {
  return (
    <group>
      <mesh position={[0, GROUND + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.78, 40]} />
        <meshBasicMaterial color={RING_COLORS[ring]} />
      </mesh>
      <mesh position={[0, GROUND + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={colors.navy} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// A navy bag of HuskiesPaws kibble with a green paw label.
function Bag() {
  return (
    <group>
      <group position={[0, GROUND + 0.6, 0]} rotation={[0, -0.25, 0]}>
        <Outlined color="#1f3b63" geometry={<primitive object={BAG} attach="geometry" />} />
        <Outlined position={[0, 0.64, 0]} color="#2b4f80" geometry={<boxGeometry args={[0.92, 0.1, 0.3]} />} />
        <mesh position={[0, 0.02, 0.26]}>
          <boxGeometry args={[0.7, 0.58, 0.02]} />
          <Toon color={colors.green} />
        </mesh>
        {/* Paw print on the label */}
        {disc(0.11, [0, -0.04, 0.28], "#ffffff")}
        {disc(0.045, [-0.12, 0.08, 0.28], "#ffffff")}
        {disc(0.045, [-0.04, 0.13, 0.28], "#ffffff")}
        {disc(0.045, [0.04, 0.13, 0.28], "#ffffff")}
        {disc(0.045, [0.12, 0.08, 0.28], "#ffffff")}
      </group>
      {/* A little spilled kibble */}
      {[[-0.3, 0.42], [-0.18, 0.5], [0.22, 0.46], [0.34, 0.38], [0.05, 0.55]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, GROUND + 0.05, z]} scale={[0.07, 0.05, 0.07]}>
          <sphereGeometry args={[1, 8, 6]} />
          <Toon color="#a0662f" />
        </mesh>
      ))}
    </group>
  );
}

// A big can of tuna: silver tin, blue label with an orange fish, pull-tab lid.
function Tuna() {
  return (
    <group position={[0, GROUND + 0.3, 0]}>
      <Outlined color="#c9d3dd" geometry={<cylinderGeometry args={[0.5, 0.5, 0.6, 28]} />} />
      <mesh>
        <cylinderGeometry args={[0.515, 0.515, 0.36, 28]} />
        <Toon color="#3f8fd2" />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.02, 28]} />
        <Toon color="#e4ebf2" />
      </mesh>
      <mesh position={[0.18, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.025, 6, 16]} />
        <Flat color="#9aa5b1" />
      </mesh>
      {/* Fish on the label */}
      <group position={[0, 0, 0.52]}>
        <mesh scale={[0.2, 0.1, 0.03]}>
          <sphereGeometry args={[1, 12, 8]} />
          <Flat color="#ff9f43" />
        </mesh>
        <mesh position={[0.24, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.3]}>
          <coneGeometry args={[0.09, 0.14, 3]} />
          <Flat color="#ff9f43" />
        </mesh>
        {disc(0.02, [-0.12, 0.02, 0.03], colors.navy)}
      </group>
    </group>
  );
}

// A glass jar of bone treats with a red lid.
function Treats() {
  const bone = (position, rotation) => (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 0.3, 8]} />
        <Toon color="#f1d9b5" />
      </mesh>
      {[-1, 1].map((end) =>
        [-1, 1].map((side) => (
          <mesh key={`${end}${side}`} position={[end * 0.16, side * 0.04, 0]} scale={0.055}>
            <sphereGeometry args={[1, 8, 6]} />
            <Toon color="#f1d9b5" />
          </mesh>
        )),
      )}
    </group>
  );
  return (
    <group position={[0, GROUND + 0.45, 0]}>
      {bone([0, -0.25, 0.05], [0, 0, 0.3])}
      {bone([0.05, -0.08, -0.05], [0, 0.6, -0.4])}
      {bone([-0.05, 0.08, 0.08], [0, -0.4, 0.2])}
      <mesh>
        <cylinderGeometry args={[0.38, 0.38, 0.9, 28]} />
        <meshBasicMaterial color="#cfefff" transparent opacity={0.35} />
      </mesh>
      <mesh scale={OUTLINE_JAR}>
        <cylinderGeometry args={[0.38, 0.38, 0.9, 28]} />
        <meshBasicMaterial color={colors.navy} side={BackSide} />
      </mesh>
      <Outlined position={[0, 0.5, 0]} color="#e53935" geometry={<cylinderGeometry args={[0.4, 0.4, 0.14, 28]} />} />
    </group>
  );
}

const FOODS = { bag: Bag, tuna: Tuna, treats: Treats };

// The food a landmark has (see foodOf in landmarks.js), standing on its ring.
export function Food({ position = [0, 0, 0], ring = "free", kind = "bag" }) {
  const Kind = FOODS[kind] ?? Bag;
  return (
    <group position={position}>
      <Ring ring={ring} />
      <Kind />
    </group>
  );
}

// The landmark at rest: its food, and the guard pet beside it (if any).
export function LandmarkScene({ guard, ring, food }) {
  return (
    <group>
      <Food position={[0.75, 0, -0.35]} ring={ring} kind={food} />
      {guard && <Pup pet={guard} position={[-0.75, 0, 0.2]} turn={0.25} />}
    </group>
  );
}

// Battle timing, in seconds.
const RUN_IN = 0.8;
const ROUND = 0.8;
const HIT_AT = 0.35; // into each round: heads meet
const TIP_OVER = 0.6;
export const BATTLE_ROUNDS = 4;
export const BATTLE_SECONDS = RUN_IN + BATTLE_ROUNDS * ROUND + TIP_OVER + 0.6;

const HOME = 1.45; // each fighter's distance from the middle
const CONTACT = 0.62; // where they are when heads meet
const lerp = (a, b, f) => a + (b - a) * f;
const easeOut = (f) => 1 - (1 - f) ** 2;

// Attacker (left, facing right) runs in; they bash heads BATTLE_ROUNDS times;
// the loser tips over. attackerWins decides who; onHit(round) fires on each
// impact and onDone() once at the end.
export function BattleScene({ attacker, defender, attackerWins, ring, food, onHit, onDone }) {
  const left = useRef(null);
  const right = useRef(null);
  const star = useRef(null);
  const started = useRef(null);
  const hits = useRef(0);
  const done = useRef(false);

  useFrame(({ clock }) => {
    if (!left.current || !right.current) return;
    started.current ??= clock.getElapsedTime();
    const t = clock.getElapsedTime() - started.current;
    let gap = HOME;
    let leftX = -HOME;

    if (t < RUN_IN) {
      leftX = lerp(-4.5, -HOME, easeOut(t / RUN_IN));
    } else {
      const fight = t - RUN_IN;
      const round = Math.floor(fight / ROUND);
      if (round < BATTLE_ROUNDS) {
        const f = (fight % ROUND) / ROUND;
        const hitF = HIT_AT / ROUND;
        // Lunge in, then bounce back.
        gap = f < hitF ? lerp(HOME, CONTACT, (f / hitF) ** 2) : lerp(CONTACT, HOME, easeOut((f - hitF) / (1 - hitF)));
        if (f >= hitF && hits.current <= round) {
          hits.current = round + 1;
          onHit?.(round + 1);
        }
        const sinceHit = (f - hitF) * ROUND;
        const s = sinceHit >= 0 && sinceHit < 0.25 ? 1 - sinceHit / 0.25 : 0;
        star.current?.scale.setScalar(s * 0.35 + 0.0001);
      } else {
        star.current?.scale.setScalar(0.0001);
        const tip = Math.min(1, (fight - BATTLE_ROUNDS * ROUND) / TIP_OVER);
        const loser = attackerWins ? right.current : left.current;
        loser.rotation.z = (attackerWins ? -1 : 1) * tip * (Math.PI / 2.2);
        loser.position.y = -tip * 0.25;
        if (!done.current && t >= BATTLE_SECONDS) {
          done.current = true;
          onDone?.();
        }
      }
      leftX = -gap;
    }
    left.current.position.x = leftX;
    right.current.position.x = t < RUN_IN ? HOME : gap;
  });

  return (
    <group>
      <Food position={[2.7, 0, -1.1]} ring={ring} kind={food} />
      <group ref={left}>
        <Pup pet={attacker} turn={Math.PI / 2} lookAround={false} />
      </group>
      <group ref={right}>
        <Pup pet={defender} turn={-Math.PI / 2} lookAround={false} phase={0.4} />
      </group>
      {/* Impact star where their heads meet */}
      <mesh ref={star} position={[0, 0.35, 0.3]} scale={0.0001}>
        <octahedronGeometry args={[1, 0]} />
        <Flat color={colors.yellow} />
      </mesh>
    </group>
  );
}
