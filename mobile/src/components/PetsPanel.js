// Pets tab: the egg you're carrying, your active pet, and your collection.
// Reads pets / egg / activePetId / issOverhead from the state (see SPLIT.md);
// until the backend adds them, it shows sample pets.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  EGG_EVERY_STEPS, ISS_RARITY_BOOST, RARITIES, eggProgress, hatchEgg, metersToHatch, petLevel, petPower, rarityOf, stepsToNextEgg,
} from "../core/pets.js";
import { colors, fonts, radius, shadow, space, type } from "../theme.js";
import { petsView } from "./fakeData.js";
import { EggArt, PetArt } from "./PetArt.js";
import { Pet3DTest } from "./Pet3D.js";
import { Button, Card, Hint } from "./ui.js";

// A fresh random pet for the dev-only hatch preview (uses the real hatching rules).
const previewPet = (walked) => hatchEgg({ id: "egg-preview", startWalked: walked }, walked);

// Runs an animation loop unless the phone asks for reduced motion.
function useLoop(makeLoop) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = makeLoop(value);
      loop.start();
    });
    return () => loop?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once
  }, []);
  return value;
}

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

const bob = (v) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ]),
  );

function ProgressBar({ progress }) {
  const percent = `${Math.round(progress * 100)}%`;
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <Svg width={percent} height="100%">
        <Defs>
          <LinearGradient id="egg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.green} />
            <Stop offset="1" stopColor={colors.yellow} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={5} fill="url(#egg)" />
      </Svg>
    </View>
  );
}

function EggCard({ egg, walked, steps }) {
  const tilt = useLoop(wobble);
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] });
  if (!egg) {
    return (
      <Card style={styles.eggCard}>
        <Text style={styles.nest}>🪺</Text>
        <View style={styles.flex}>
          <Text style={type.heading}>{`Next egg in ${stepsToNextEgg(steps).toLocaleString()} steps`}</Text>
          <Hint>{`You find an egg every ${EGG_EVERY_STEPS} steps. Only walking earns eggs.`}</Hint>
        </View>
      </Card>
    );
  }
  return (
    <Card style={styles.eggCard}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <EggArt size={64} />
      </Animated.View>
      <View style={styles.flex}>
        <Text style={type.heading}>{`Walk ${metersToHatch(egg, walked)} m to hatch`}</Text>
        <ProgressBar progress={eggProgress(egg, walked)} />
        <Hint>Keep walking with your egg and it hatches into a pet.</Hint>
      </View>
    </Card>
  );
}

function ActivePet({ pet, walked }) {
  const lift = useLoop(bob);
  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rarity = rarityOf(pet);
  return (
    <Card style={[styles.active, { borderColor: rarity.color }]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <PetArt pet={pet} size={116} />
      </Animated.View>
      <View style={styles.flex}>
        <Text style={[styles.rarity, { color: rarity.color }]}>{rarity.label}</Text>
        <Text style={type.title}>{pet.name}</Text>
        <Text style={styles.meta}>{`${pet.petClass} · Lv ${petLevel(pet, walked)}${pet.spaceBorn ? " · 🛰️ Space-born" : ""}`}</Text>
        <Text style={styles.power}>{`⚡ ${petPower(pet, walked)} power`}</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>★ Active pet</Text>
        </View>
      </View>
    </Card>
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
            style={[styles.dot, { backgroundColor: rarity.color }, selected && styles.dotSelected]}
          />
        );
      })}
    </View>
  );
}

function PetTile({ pet, walked, active, onPress }) {
  const rarity = rarityOf(pet);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${rarity.label} ${pet.petClass}, power ${petPower(pet, walked)}`}
      accessibilityHint={active ? "Your active pet" : "Makes this your active pet"}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tile, active && styles.tileActive, pressed && styles.pressed]}
    >
      {active && <Text style={styles.star}>★</Text>}
      <PetArt pet={pet} size={78} />
      <Text style={styles.tilePower}>{`⚡${petPower(pet, walked)}`}</Text>
      <Text style={styles.tileName} numberOfLines={1}>{pet.name}</Text>
      <Text style={[styles.tileRarity, { color: rarity.color }]}>{rarity.label}</Text>
    </Pressable>
  );
}

export function PetsPanel({ state, game }) {
  const [filter, setFilter] = useState(null);
  const [test3d, setTest3d] = useState(null);
  const { walked, steps } = state.progress;
  const { sample, pets, egg, active } = petsView(state); // sample data until the backend adds pets
  const shown = filter ? pets.filter((p) => p.rarity === filter) : pets;

  const setActive = (id) => (game.setActivePet ? game.setActivePet(id) : game.set({ activePetId: id }));
  const previewHatch = () => game.set({ hatching: previewPet(walked) });

  return (
    <View style={styles.panel}>
      {state.issOverhead && (
        <Card style={styles.iss}>
          <Text style={styles.issText}>{`🛰️ The ISS is overhead right now! Eggs that hatch now are ${ISS_RARITY_BOOST}x as likely to be rare.`}</Text>
        </Card>
      )}
      <EggCard egg={egg} walked={walked} steps={steps} />
      {active && <ActivePet pet={active} walked={walked} />}

      <View style={styles.header}>
        <Text style={type.heading}>{`Your pets · ${pets.length}`}</Text>
        <RarityDots filter={filter} onChange={setFilter} />
      </View>
      {pets.length === 0 ? (
        <Hint>No pets yet. Walk to fill your egg and hatch your first one!</Hint>
      ) : (
        <View style={styles.grid}>
          {shown.map((pet) => (
            <PetTile key={pet.id} pet={pet} walked={walked} active={pet.id === active?.id} onPress={() => setActive(pet.id)} />
          ))}
        </View>
      )}

      {sample && <Hint>Sample pets for now. Your real pets appear here once hatching is connected.</Hint>}
      {__DEV__ && <Button title="🥚 Preview hatch (dev only)" variant="secondary" onPress={previewHatch} />}
      {__DEV__ && active && <Button title="🧊 3D test (dev only)" variant="secondary" onPress={() => setTest3d(active)} />}
      <Pet3DTest pet={test3d} onClose={() => setTest3d(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.md },
  flex: { flex: 1, gap: space.xs },
  iss: { backgroundColor: colors.navy },
  issText: { ...type.label, color: colors.white },
  eggCard: { flexDirection: "row", alignItems: "center", gap: space.md },
  nest: { fontSize: 44 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.stripe, overflow: "hidden", marginVertical: 2 },
  active: { flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: 2 },
  rarity: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  meta: { ...type.caption },
  power: { ...type.bodyBold },
  activeBadge: { alignSelf: "flex-start", backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10, marginTop: 2 },
  activeBadgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.greenDark },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs },
  dots: { flexDirection: "row", gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.white, ...shadow.soft },
  dotSelected: { borderColor: colors.navy, transform: [{ scale: 1.15 }] },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: space.md, marginHorizontal: "-1%" },
  tile: { width: "31.33%", marginHorizontal: "1%", alignItems: "center", paddingVertical: space.sm, borderRadius: radius.card, borderWidth: 2, borderColor: "transparent" },
  tileActive: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  pressed: { opacity: 0.7 },
  star: { position: "absolute", top: 4, right: 8, fontSize: 16, color: colors.green },
  tilePower: { fontFamily: fonts.black, fontSize: 15, color: colors.ink, marginTop: 2 },
  tileName: { ...type.label },
  tileRarity: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
});
