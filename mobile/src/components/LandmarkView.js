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
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petPower } from "../core/pets.js";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";
import { petsView } from "./fakeData.js";
import { BATTLE_ROUNDS, BattleScene, LandmarkScene, RING_COLORS } from "./Landmark3D.js";
import { FIGHT_RANGE_M, claimLocally, landmarksView, reachOf, ringOf } from "./landmarks.js";
import { PetSvg } from "./PetArt.js";
import { squadStatuses } from "./petStatus.js";
import { FitCamera, Field } from "./SquadView.js";
import { Button, Hint } from "./ui.js";

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

  const finish = (outcome) => {
    if (outcome.turf) game.set({ turf: outcome.turf }); // local rules only; the backend updates turf itself
    game.set({ status: outcome.message });
    setBattle(null);
    setResult(outcome);
    setBusy(false);
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
    if (fight) setBattle({ attacker: picked, power, defender: guard.pet, outcome, hp: { you: 100, them: 100 } });
    else finish(outcome);
  };

  // Each hit: the loser loses a quarter of its HP; the winner a little, more if the loser was close in power.
  const onHit = (round) =>
    setBattle((b) => {
      if (!b) return b;
      const youWin = b.outcome.won;
      const ratio = youWin ? b.defender.power / b.power : b.power / b.defender.power;
      const scratch = Math.round(Math.min(18, Math.max(4, ratio * 12)));
      const loserHp = Math.max(0, 100 - (100 / BATTLE_ROUNDS) * round);
      const winnerHp = Math.max(8, 100 - scratch * round);
      return { ...b, hp: youWin ? { you: winnerHp, them: loserHp } : { you: loserHp, them: winnerHp } };
    });

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
              onHit={onHit}
              onDone={() => finish(battle.outcome)}
            />
          ) : (
            <LandmarkScene guard={guard?.pet ?? null} ring={ring} />
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
              {guard.maxHp ? <HpBar name="Guard HP" power={guard.pet.power} hp={(100 * guard.hp) / guard.maxHp} color={RING_COLORS[ring]} /> : null}
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
              {!reach.inRange && <Hint>{`Walk closer: you're ${reach.meters} m away (fights need ${FIGHT_RANGE_M} m).`}</Hint>}
              <Button
                title={picked ? `${icon} ${action} with ${picked.name}` : action}
                size="large"
                onPress={go}
                disabled={!picked || !reach.inRange || busy}
              />
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
