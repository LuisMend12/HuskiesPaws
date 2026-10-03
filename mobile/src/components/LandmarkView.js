// Landmark screen (tap a food bag on the map): the 3D bag on its ring and the
// guard pet, a squad pet picker, and Claim / Challenge. A challenge plays a
// head-bashing battle with both HP bars, then shows who holds the landmark.
// Uses game.claimTurf(landmarkId, petId) -> { result, won, message } when the
// backend has it; until then claimLocally() applies the server's rules here.
// Loaded lazily (it pulls in three.js).
/* eslint-disable react/no-unknown-property -- three.js elements (lights) aren't DOM tags */
import "./threePolyfill.js"; // must stay first: three crashes on React Native without it
import { Canvas } from "@react-three/fiber/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petPower } from "../core/pets.js";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";
import { petsView } from "./fakeData.js";
import { BATTLE_ROUNDS, BattleScene, LandmarkScene, RING_COLORS } from "./Landmark3D.js";
import {
  FIGHT_RANGE_M, MAX_HP, READY_HP, claimLocally, healMinutes, hpNow, landmarksView, petHpOf, reachOf, ringOf,
} from "./landmarks.js";
import { PetSvg } from "./PetArt.js";
import { squadStatuses } from "./petStatus.js";
import { FitCamera, Field } from "./SquadView.js";
import { Button, Hint } from "./ui.js";

// Event handlers read the clock through this (not while drawing the screen).
const clockNow = () => Date.now();

// Re-renders every few seconds so healing HP bars move.
function useTicker(ms) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(timer);
  }, [ms]);
}

// How much the winner gets scratched per hit: more when the loser was close in power.
function scratchPerHit(winnerPower, loserPower) {
  return Math.round(Math.min(18, Math.max(4, (loserPower / winnerPower) * 12)));
}

// HP for both sides after `round` hits (round = BATTLE_ROUNDS at the end).
function hpAfter(b, round) {
  const youWin = b.outcome.won;
  const scratch = youWin ? scratchPerHit(b.power, b.defender.power) : scratchPerHit(b.defender.power, b.power);
  const loser = (start) => Math.max(0, start - (start / BATTLE_ROUNDS) * round);
  const winner = (start) => Math.max(8, start - scratch * round);
  return youWin ? { you: winner(b.start.you), them: loser(b.start.them) } : { you: loser(b.start.you), them: winner(b.start.them) };
}

const SCENE_WIDTH = 3.8; // world units to fit across the screen at rest
const BATTLE_WIDTH = 5.2; // and during a battle

function HpBar({ name, power, hp, color, right }) {
  const fill = hp > 50 ? colors.green : hp > 25 ? colors.yellow : colors.coral;
  return (
    <View style={[styles.hp, right && styles.hpRight]}>
      <Text style={styles.hpName} numberOfLines={1}>{`${name} · ⚡${power}`}</Text>
      <View style={[styles.hpTrack, { borderColor: color }]}>
        <View style={[styles.hpFill, { width: `${Math.max(0, hp)}%`, backgroundColor: fill }, right && styles.hpFillRight]} />
      </View>
    </View>
  );
}

function PetPicker({ pets, walked, picked, onPick }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picker}>
      {pets.map((pet) => {
        const selected = pet.id === picked?.id;
        return (
          <Pressable
            key={pet.id}
            onPress={() => onPick(pet.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${pet.name}, power ${petPower(pet, walked)}`}
            style={[styles.pick, selected && styles.pickSelected]}
          >
            <PetSvg pet={pet} size={44} />
            <Text style={styles.pickName} numberOfLines={1}>{pet.name}</Text>
            <Text style={styles.pickPower}>{`⚡${petPower(pet, walked)}`}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function LandmarkView({ state, game, landmarkId, onClose }) {
  const insets = useSafeAreaInsets();
  const [pickedId, setPickedId] = useState(null);
  const [battle, setBattle] = useState(null); // { attacker, power, defender, outcome, hp: { you, them } }
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ar, setAr] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  useTicker(3000);

  const walked = state.progress.walked;
  const landmark = landmarksView(state).find((l) => l.landmarkId === landmarkId);
  const fighters = squadStatuses(petsView(state).squad, state)
    .filter((s) => s.status === "with-you")
    .map((s) => s.pet)
    .sort((a, b) => petPower(b, walked) - petPower(a, walked));
  const picked = fighters.find((p) => p.id === pickedId) ?? fighters[0] ?? null;
  if (!landmark) return null;

  const guard = landmark.guard;
  const ring = ringOf(landmark);
  const reach = reachOf(state, landmark);

  // after: { you, them } HP once a battle ends (null when there was no fight).
  // With local rules, damage stays and heals slowly: the new guard keeps its HP,
  // a guard that held on keeps its HP, and a pet that lost drops to 0 and rests.
  const finish = (outcome, attacker, after) => {
    const now = clockNow();
    const patch = { status: outcome.message };
    if (!game.claimTurf) {
      let turf = outcome.turf;
      if (turf && outcome.won) {
        const hp = after ? after.you : petHpOf(state, attacker.id, now);
        turf = turf.map((t) => (t.mine && String(t.landmarkId) === landmark.landmarkId ? { ...t, hp, hpAt: now } : t));
      }
      if (after && !outcome.won) {
        turf = petsView(state).turf.map((t) =>
          String(t.landmarkId) === landmark.landmarkId ? { ...t, hp: after.them, maxHp: t.maxHp ?? MAX_HP, hpAt: now } : t,
        );
        patch.petHp = { ...state.petHp, [attacker.id]: { hp: 0, hpAt: now } };
      }
      if (turf) patch.turf = turf;
    }
    game.set(patch);
    setBattle(null);
    setResult({ ...outcome, attacker });
    setBusy(false);
  };

  // Walk to the landmark; in demo mode the walk is simulated, then this screen reopens.
  const walkThere = async () => {
    const place = { id: landmark.landmarkId, title: landmark.title, lat: landmark.lat, lon: landmark.lon, distance: reach.meters };
    onClose();
    if (game.walkTo) {
      await game.walkTo(place);
    } else {
      game.set({ discovery: { place, summary: { extract: "", photo: null, url: "" }, memo: "", agentId: "pathfinder" } });
      await game.guideToDiscovery();
    }
    if (state.demoMode) game.set({ landmarkOpen: landmark.landmarkId });
  };

  const go = async () => {
    if (!picked) return;
    setBusy(true);
    const power = petPower(picked, walked);
    const outcome = game.claimTurf ? await game.claimTurf(landmark.landmarkId, picked.id) : claimLocally(state, landmark, picked, power);
    if (!outcome) {
      setBusy(false);
      return;
    }
    const fight = guard && !guard.mine && (outcome.result === "captured" || outcome.result === "defended");
    const start = { you: petHpOf(state, picked.id), them: hpNow(guard) };
    if (fight) setBattle({ attacker: picked, power, defender: guard.pet, outcome, start, hp: start });
    else finish(outcome, picked, null);
  };

  // Each hit: the loser loses a share of its HP; the winner gets scratched.
  const onHit = (round) => setBattle((b) => (b ? { ...b, hp: hpAfter(b, round) } : b));

  const showCamera = ar && permission?.granted;
  const toggleAr = async () => {
    if (!ar && !permission?.granted) await requestPermission();
    setAr(!ar);
  };

  const action = !guard ? "Claim" : guard.mine ? "Swap in" : "Challenge";
  const icon = !guard ? "🐾" : guard.mine ? "🔁" : "⚔️";

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        {showCamera ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : <Field />}
        <Canvas style={styles.canvas} gl={{ alpha: true }} camera={{ fov: 40 }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
          <FitCamera width={battle ? BATTLE_WIDTH : SCENE_WIDTH} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[2.5, 4, 3]} intensity={2.4} />
          {battle ? (
            <BattleScene
              attacker={battle.attacker}
              defender={battle.defender}
              attackerWins={battle.outcome.won}
              ring={ring}
              food={landmark.food}
              onHit={onHit}
              onDone={() => finish(battle.outcome, battle.attacker, hpAfter(battle, BATTLE_ROUNDS))}
            />
          ) : (
            <LandmarkScene guard={guard?.pet ?? null} ring={ring} food={landmark.food} />
          )}
        </Canvas>

        <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
          <Button title="✕ Close" variant="secondary" onPress={onClose} disabled={Boolean(battle)} />
          <Button title={showCamera ? "🌳 Field" : "📷 AR"} variant={showCamera ? "primary" : "secondary"} onPress={toggleAr} />
        </View>
        <View style={[styles.titleWrap, { top: insets.top + 64 }]}>
          <Text style={styles.title} numberOfLines={2}>{landmark.title}</Text>
          <View style={[styles.owner, { backgroundColor: RING_COLORS[ring] }]}>
            <Text style={styles.ownerText}>{!guard ? "Free to claim" : guard.mine ? "Yours" : `Held by ${guard.ownerName}`}</Text>
          </View>
          {guard && !battle && (
            <View style={styles.guardCard}>
              <Text style={styles.guardText}>{`🛡️ ${guard.mine ? "Your" : `${guard.ownerName}'s`} ${guard.pet.name} · ⚡${guard.pet.power}`}</Text>
              {guard.maxHp ? (
                <HpBar name={`Guard HP · ${Math.round(hpNow(guard))}/${guard.maxHp}`} power={guard.pet.power} hp={(100 * hpNow(guard)) / guard.maxHp} color={RING_COLORS[ring]} />
              ) : null}
            </View>
          )}
          {battle && (
            <View style={styles.battleBars}>
              <HpBar name={battle.attacker.name} power={battle.power} hp={battle.hp.you} color={colors.green} />
              <Text style={styles.vs}>VS</Text>
              <HpBar name={battle.defender.name} power={battle.defender.power} hp={battle.hp.them} color={colors.coral} right />
            </View>
          )}
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          {result ? (
            <>
              <Text style={styles.resultTitle}>
                {result.won ? (result.result === "captured" ? "🏰 Captured!" : "🐾 It's yours!") : result.result === "capped" ? "✋ Limit reached" : "🛡️ They held on"}
              </Text>
              <Text style={type.body}>{result.message}</Text>
              {!result.won && result.attacker && result.result === "defended" && (
                <Hint>{`${result.attacker.name} is healing: ready to fight again in about ${healMinutes(0, READY_HP)} min.`}</Hint>
              )}
              <Button title="Done" onPress={onClose} size="large" />
            </>
          ) : battle ? (
            <Text style={styles.resultTitle}>⚔️ Battle!</Text>
          ) : fighters.length === 0 ? (
            <Hint>All your squad pets are busy. Pick more pets for your squad in the Pets tab.</Hint>
          ) : (
            <>
              <Text style={type.heading}>{guard?.mine ? "Swap in a different guard" : "Pick a squad pet"}</Text>
              <PetPicker pets={fighters} walked={walked} picked={picked} onPick={setPickedId} />
              {guard && !guard.mine && picked && (
                <Hint>{`⚡${petPower(picked, walked)} vs ⚡${guard.pet.power}: the stronger pet wins and holds the landmark.`}</Hint>
              )}
              {picked && petHpOf(state, picked.id) < MAX_HP && <Hint>{`${picked.name} has ${Math.round(petHpOf(state, picked.id))} HP (healing).`}</Hint>}
              {reach.inRange ? (
                <Button title={picked ? `${icon} ${action} with ${picked.name}` : action} size="large" onPress={go} disabled={!picked || busy} />
              ) : (
                <>
                  <Hint>{`You're ${reach.meters} m away. Walk within ${FIGHT_RANGE_M} m to ${action.toLowerCase()} it.`}</Hint>
                  <Button title={`🚶 Walk there (${reach.meters} m)`} size="large" onPress={walkThere} />
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  canvas: { position: "absolute", left: 0, right: 0, top: 0, bottom: 230 },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.md },
  owner: { borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 14, ...shadow.soft },
  ownerText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.white },
  titleWrap: { position: "absolute", left: space.lg, right: space.lg, gap: space.sm, alignItems: "center" },
  title: { ...type.title, color: colors.ink, textAlign: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: radius.card, paddingHorizontal: space.md, paddingVertical: 4, overflow: "hidden" },
  guardCard: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: radius.card, padding: space.sm, gap: 4, alignSelf: "stretch" },
  guardText: { ...type.label, textAlign: "center" },
  battleBars: { flexDirection: "row", alignItems: "center", gap: space.sm, alignSelf: "stretch" },
  vs: { fontFamily: fonts.black, fontSize: 18, color: colors.white, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  hp: { flex: 1, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: radius.small, padding: 6, gap: 3 },
  hpRight: { alignItems: "flex-end" },
  hpName: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  hpTrack: { alignSelf: "stretch", height: 10, borderRadius: 5, borderWidth: 1.5, backgroundColor: colors.stripe, overflow: "hidden" },
  hpFill: { height: "100%" },
  hpFillRight: { alignSelf: "flex-end" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 230, backgroundColor: colors.card, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.lg, gap: space.sm, ...shadow.raised },
  picker: { gap: space.sm, paddingVertical: 2 },
  pick: { width: 76, alignItems: "center", padding: 6, borderRadius: radius.card, borderWidth: 2, borderColor: colors.border },
  pickSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  pickName: { ...type.label, fontSize: 12 },
  pickPower: { fontFamily: fonts.black, fontSize: 12, color: colors.ink },
  resultTitle: { ...type.title },
});
