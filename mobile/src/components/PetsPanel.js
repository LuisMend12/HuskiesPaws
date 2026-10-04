// Pets tab: your collection (tap a pet to add it to or remove it from your
// squad) and the eggs you're carrying, each with its hatching progress.
// Reads pets / eggs / squad / issOverhead from the state (docs/HANDOFF-backend.md);
// until the backend adds them, it shows sample data.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  EGG_EVERY_STEPS, ISS_RARITY_BOOST, RARITIES, eggProgress, eggTierOf, hatchEgg, hatchMetersOf, petLevel, petPower, rarityOf, rollEggTier,
  stepsToNextEgg,
} from "../core/pets.js";
import { LEAGUES, leagueOf, rankFor } from "../core/rank.js";
import { scoreOf } from "../game/state.js";
import { colors, fonts, radius, space, type } from "../theme.js";
import { petsView } from "./fakeData.js";
import { EggArt, PetArt } from "./PetArt.js";
import { recallLocally } from "./landmarks.js";
import { squadSizeFor } from "./petStatus.js";
import { PetsIcon, RarityMark } from "./GameIcons.js";
import { Button, Card, EmptyState, Hint } from "./ui.js";

// A fresh random pet for the dev-only hatch preview (uses the real hatching rules).
const previewPet = (walked) => hatchEgg({ id: "egg-preview", startWalked: walked, tier: rollEggTier().id }, walked);

const formatMeters = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);
const eggDone = (egg, walked) => Math.max(0, walked - egg.startWalked);

const wobble = (v) =>
  Animated.loop(
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(v, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(v, { toValue: -1, duration: 160, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.5, duration: 140, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]),
  );

// Runs an animation loop (after delayMs) unless the phone asks for reduced motion.
function useLoop(makeLoop, delayMs = 0) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop = null;
    const timer = setTimeout(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
        if (reduced) return;
        loop = makeLoop(value);
        loop.start();
      });
    }, delayMs);
    return () => {
      clearTimeout(timer);
      loop?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once
  }, []);
  return value;
}

function ProgressBar({ progress, id }) {
  const percent = `${Math.round(progress * 100)}%`;
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      {/* A plain View sizes the fill: an Svg's own percent width doesn't update after it first draws. */}
      <View style={{ width: percent, height: "100%" }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`egg-${id}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.green} />
              <Stop offset="1" stopColor={colors.yellow} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={5} fill={`url(#egg-${id})`} />
        </Svg>
      </View>
    </View>
  );
}

function EggRow({ egg, walked, index, onHatch }) {
  const tilt = useLoop(wobble, index * 450); // eggs wobble one after another, not in sync
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] });
  const done = eggDone(egg, walked);
  const needs = hatchMetersOf(egg);
  const tier = eggTierOf(egg);
  const progress = Math.min(1, done / needs);
  return (
    <View style={styles.eggRow}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <EggArt size={46} seed={egg.id} tier={egg.tier} />
      </Animated.View>
      <View style={styles.flex}>
        <View style={styles.eggTop}>
          <Text style={type.label}>{`${tier?.label ?? "Egg"} · ${formatMeters(needs)}`}</Text>
          <Text style={styles.eggMeters}>{progress >= 1 ? "Ready!" : `${Math.ceil(needs - done)} m to go`}</Text>
        </View>
        <ProgressBar progress={progress} id={egg.id} />
        {tier && <Text style={styles.eggOdds}>{`${tier.odds.epic + tier.odds.legendary}% epic or legendary`}</Text>}
        {progress >= 1 && onHatch ? (
          <Button title="Hatch now" onPress={onHatch} accessibilityLabel="Hatch this egg" />
        ) : null}
      </View>
    </View>
  );
}

function RarityDots({ filter, onChange }) {
  return (
    <View style={styles.dots}>
      {RARITIES.map((rarity) => {
        const selected = filter === rarity.id;
        return (
          <Pressable
            key={rarity.id}
            onPress={() => onChange(selected ? null : rarity.id)}
            accessibilityRole="button"
            accessibilityLabel={`Show only ${rarity.label} pets`}
            accessibilityState={{ selected }}
            hitSlop={8}
            style={[styles.dotWrap, selected && styles.dotSelected]}
          >
            <RarityMark mark={rarity.mark} color={rarity.color} size={18} label={rarity.label} />
          </Pressable>
        );
      })}
    </View>
  );
}

function PetTile({ pet, walked, slot, onPress }) {
  const rarity = rarityOf(pet);
  const inSquad = slot > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${rarity.label} ${pet.petClass}, level ${petLevel(pet, walked)}, power ${petPower(pet, walked)}`}
      accessibilityHint={inSquad ? "Takes this pet out of your squad" : "Adds this pet to your squad"}
      accessibilityState={{ selected: inSquad }}
      style={({ pressed }) => [styles.tile, inSquad && styles.tileSquad, pressed && styles.pressed]}
    >
      {inSquad && (
        <View style={styles.slot}>
          <Text style={styles.slotText}>{slot}</Text>
        </View>
      )}
      <PetArt pet={pet} size={78} />
      <Text style={styles.tilePower}>{`⚡${petPower(pet, walked)}`}</Text>
      <Text style={styles.tileName} numberOfLines={1}>{pet.name}</Text>
      <Text style={[styles.tileRarity, { color: rarity.color }]}>{rarity.label}</Text>
    </Pressable>
  );
}

export function PetsPanel({ state, game }) {
  const [filter, setFilter] = useState(null);
  const { walked, steps } = state.progress;
  const { sample, pets, eggs, squadIds } = petsView(state);
  const tier = LEAGUES.indexOf(leagueOf(rankFor(scoreOf(state)).current));
  const size = squadSizeFor(state, tier);
  const shown = filter ? pets.filter((p) => p.rarity === filter) : pets;

  const setSquad = (ids) => (game.setSquad ? game.setSquad(ids) : game.set({ squad: ids }));
  const toggle = async (id) => {
    if (squadIds.includes(id)) {
      if (squadIds.length === 1) return game.set({ status: "Keep at least one pet in your squad." });
      // Taking a guard out of the squad calls it back and frees its landmark.
      if (game.recallGuard) {
        if (!(await game.recallGuard(id))) return;
      }
      else {
        const recall = recallLocally(state, id);
        if (recall) game.set(recall);
      }
      return setSquad(squadIds.filter((x) => x !== id));
    }
    if (squadIds.length >= size) {
      return game.set({ status: `Your squad is full (${size}/${size}). Tap a pet with a number to take it out first.` });
    }
    return setSquad([...squadIds, id]);
  };
  const previewHatch = () => game.set({ hatching: previewPet(walked) });
  const hatchReady = eggs.some((egg) => eggProgress(egg, walked) >= 1);

  const petBlock = (
    <>
      <View style={styles.header}>
        <Text style={type.heading}>{`Your pets · ${pets.length}`}</Text>
        <RarityDots filter={filter} onChange={setFilter} />
      </View>
      <Hint>{`Tap a pet to add it to your squad or take it out · ${squadIds.length}/${size} in your squad`}</Hint>
      {pets.length === 0 ? (
        <EmptyState icon={<PetsIcon size={40} />} title="No pets yet" body="Keep walking to earn an egg, then walk a bit farther to hatch it." />
      ) : (
        <View style={styles.grid}>
          {shown.map((pet) => (
            <PetTile key={pet.id} pet={pet} walked={walked} slot={squadIds.indexOf(pet.id) + 1} onPress={() => toggle(pet.id)} />
          ))}
        </View>
      )}
    </>
  );

  const eggBlock = (
    <>
      <View style={styles.header}>
        <Text style={type.heading}>{`Your eggs · ${eggs.length}`}</Text>
        <Hint>{`Next egg in ${stepsToNextEgg(steps).toLocaleString()} steps`}</Hint>
      </View>
      <Card style={styles.eggs}>
        {eggs.length === 0 ? (
          <Hint>{`No eggs yet. You find one every ${EGG_EVERY_STEPS} steps; only walking earns eggs.`}</Hint>
        ) : (
          eggs.map((egg, i) => (
            <EggRow key={egg.id} egg={egg} walked={walked} index={i} onHatch={game.hatchEgg} />
          ))
        )}
      </Card>
    </>
  );

  return (
    <View style={styles.panel}>
      {state.issOverhead && (
        <Card style={styles.iss}>
          <Text style={styles.issText}>{`🛰️ The ISS is overhead right now! Eggs that hatch now are ${ISS_RARITY_BOOST}x as likely to be rare.`}</Text>
        </Card>
      )}
      {hatchReady ? eggBlock : petBlock}
      {hatchReady ? petBlock : eggBlock}
      {sample && <Hint>Sample pets and eggs for now. Yours appear here once hatching is connected.</Hint>}
      {__DEV__ && <Button title="Preview hatch (dev only)" icon={PetsIcon} variant="secondary" onPress={previewHatch} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.sm },
  flex: { flex: 1, gap: 4 },
  iss: { backgroundColor: colors.navy },
  issText: { ...type.label, color: colors.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.sm },
  dots: { flexDirection: "row", gap: 10, alignItems: "center" },
  dotWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 2, borderColor: "transparent" },
  dotSelected: { borderColor: colors.navy, backgroundColor: colors.cream },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: space.md, marginHorizontal: "-1%", marginTop: space.xs },
  tile: { width: "31.33%", marginHorizontal: "1%", alignItems: "center", paddingVertical: space.sm, borderRadius: radius.card, borderWidth: 2, borderColor: "transparent" },
  tileSquad: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  pressed: { opacity: 0.7 },
  slot: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", zIndex: 1 },
  slotText: { fontFamily: fonts.black, fontSize: 12, color: colors.white },
  tilePower: { fontFamily: fonts.black, fontSize: 15, color: colors.ink, marginTop: 2 },
  tileName: { ...type.label },
  tileRarity: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  eggs: { gap: space.md },
  eggRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  eggTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  eggMeters: { ...type.caption },
  eggOdds: { ...type.caption, fontSize: 11 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.stripe, overflow: "hidden" },
});
