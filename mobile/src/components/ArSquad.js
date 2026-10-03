// Motion-sensor AR for the squad view. The 3D camera turns with the phone
// (expo-sensors DeviceMotion), so pets stay put in the room: turn the phone and
// they slide out of view. When the phone settles on a new spot, they run over
// to the floor you're looking at, keep their own place in the group, then turn
// to face you. Rotation only (no walking around the room, no real floor): true
// AR would need ARKit/ARCore in a development build.
// Loaded lazily with SquadView.js (three.js must not load at app start).
/* eslint-disable react/no-unknown-property -- three.js elements (group) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { useFrame } from "@react-three/fiber/native";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { Pup } from "./Pet3D.js";

const EYE = 3.2; // camera height above the floor, in world units (a pet is ~1 tall)
const PET_SCALE = 0.7;
const FEET = 0.86 * PET_SCALE; // lift each pet so its feet touch the floor (y = 0)
const VIEW_DISTANCE = { min: 2.5, max: 8, fallback: 4.5 }; // where on the floor the group gathers
const SETTLE_MS = 450; // the phone must be still this long before pets react
const STILL_RAD_PER_S = 0.35; // slower than this counts as still
const MOVE_ON = 1.4; // pets regroup when the view is this far from their spot
const RUN_SPEED = 3.2; // units per second
const STAGGER_S = 0.18; // each pet starts running a little after the one before
const ARRIVED = 0.08;
// Each pet's spot around the group's center, in view space (x right, z toward you).
const SLOTS = [[0, 0], [-1.25, 0.35], [1.25, 0.35], [-0.65, -0.9], [0.65, -0.9]];

// --- Phone orientation -> camera rotation (the W3C deviceorientation recipe) ---
const ZEE = new Vector3(0, 0, 1);
const EULER = new Euler();
const Q0 = new Quaternion();
const Q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // look out of the back of the phone

function setFromDevice(quaternion, { alpha, beta, gamma }, orientationDeg) {
  EULER.set(beta, alpha, -gamma, "YXZ");
  quaternion.setFromEuler(EULER);
  quaternion.multiply(Q1);
  quaternion.multiply(Q0.setFromAxisAngle(ZEE, (-orientationDeg * Math.PI) / 180));
}

// Latest phone orientation, kept in a ref (60 updates a second shouldn't re-render React).
function useDeviceRotation() {
  const latest = useRef(null);
  useEffect(() => {
    let subscription = null;
    let cancelled = false;
    (async () => {
      if (!(await DeviceMotion.isAvailableAsync())) return;
      const { granted } = await DeviceMotion.requestPermissionsAsync();
      if (!granted || cancelled) return;
      DeviceMotion.setUpdateInterval(16);
      subscription = DeviceMotion.addListener(({ rotation, orientation }) => {
        if (rotation) latest.current = { rotation, orientation: orientation ?? 0 };
      });
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
  return latest;
}

// Where the view meets the floor: along the camera's forward ray, or straight ahead
// when you're looking at the horizon. Also returns the heading (radians around Y).
const FORWARD = new Vector3();
function viewPoint(camera) {
  FORWARD.set(0, 0, -1).applyQuaternion(camera.quaternion);
  const flat = Math.hypot(FORWARD.x, FORWARD.z) || 1e-6;
  const heading = Math.atan2(FORWARD.x, FORWARD.z);
  let distance = VIEW_DISTANCE.fallback;
  if (FORWARD.y < -0.05) distance = Math.min(VIEW_DISTANCE.max, Math.max(VIEW_DISTANCE.min, (EYE / -FORWARD.y) * flat));
  return { x: (FORWARD.x / flat) * distance, z: (FORWARD.z / flat) * distance, heading };
}

// A spot in the group, turned to face the camera from the group's center.
function slotAt(center, i) {
  const [sx, sz] = SLOTS[i % SLOTS.length];
  const toCamera = Math.atan2(-center.x, -center.z); // direction from the center back to you
  const cos = Math.cos(toCamera);
  const sin = Math.sin(toCamera);
  // Local x is "your right" when you face the group; local z points toward you.
  return { x: center.x + sx * cos + sz * sin, z: center.z - sx * sin + sz * cos };
}

function ArPet({ pet, index, center }) {
  const ref = useRef(null);
  const lastCenter = useRef(null);
  const startAt = useRef(0);

  useFrame(({ clock }, delta) => {
    const g = ref.current;
    if (!g || !center.current) return;
    const t = clock.getElapsedTime();
    if (lastCenter.current !== center.current) {
      lastCenter.current = center.current;
      startAt.current = t + index * STAGGER_S; // run one after another
    }
    const goal = slotAt(center.current, index);
    const dx = goal.x - g.position.x;
    const dz = goal.z - g.position.z;
    const gap = Math.hypot(dx, dz);
    if (gap > ARRIVED && t >= startAt.current) {
      const step = Math.min(gap, RUN_SPEED * delta);
      g.position.x += (dx / gap) * step;
      g.position.z += (dz / gap) * step;
      g.rotation.y = Math.atan2(dx, dz); // the model faces +z
      g.position.y = FEET + Math.abs(Math.sin(t * 14)) * 0.12; // running hops
    } else {
      g.position.y = FEET;
      g.rotation.y = Math.atan2(-g.position.x, -g.position.z); // face you
    }
  });

  // Pets start a little further out and run into their places when AR opens.
  return (
    <group ref={ref} position={[0, FEET, -VIEW_DISTANCE.max]} scale={PET_SCALE}>
      <Pup pet={pet} phase={index * 0.7} lookAround={false} />
    </group>
  );
}

export function ArSquad({ pets }) {
  const device = useDeviceRotation();
  const center = useRef(null); // { x, z } where the group gathers; replaced (new object) to regroup
  const settle = useRef({ heading: null, stillSince: 0 });
  const ready = useRef(false);

  useFrame(({ clock, camera }, delta) => {
    if (!ready.current) {
      ready.current = true;
      camera.position.set(0, EYE, 0);
      camera.fov = 60; // closer to a phone camera's view than the default
      camera.updateProjectionMatrix();
    }
    const now = clock.getElapsedTime() * 1000;
    if (device.current) setFromDevice(camera.quaternion, device.current.rotation, device.current.orientation);
    else camera.lookAt(0, 0, -VIEW_DISTANCE.fallback); // no sensor: a fixed view of the group
    const view = viewPoint(camera);
    if (!center.current) {
      center.current = { x: view.x, z: view.z };
      settle.current = { heading: view.heading, stillSince: now };
      return;
    }
    // Is the phone still? Compare the heading to the last frame's.
    const s = settle.current;
    const turn = Math.abs(Math.atan2(Math.sin(view.heading - s.heading), Math.cos(view.heading - s.heading)));
    if (turn / Math.max(delta, 1e-3) > STILL_RAD_PER_S) s.stillSince = now;
    s.heading = view.heading;
    const away = Math.hypot(view.x - center.current.x, view.z - center.current.z);
    if (now - s.stillSince > SETTLE_MS && away > MOVE_ON) center.current = { x: view.x, z: view.z };
  });

  return (
    <group>
      {pets.map((pet, i) => (
        <ArPet key={pet.id} pet={pet} index={i} center={center} />
      ))}
    </group>
  );
}
