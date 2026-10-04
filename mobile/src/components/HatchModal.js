// Hatch reveal: the egg shakes, flashes white, and the new pet springs out over
// a glowing ring in its rarity color. Opens while state.hatching holds a pet.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Modal, StyleSheet, Text, View } from "react-native";
import { petPower, rarityOf } from "../core/pets.js";
import { colors, fonts, space, type } from "../theme.js";
import { RarityMark } from "./GameIcons.js";
import { EggArt, PetArt } from "./PetArt.js";
import { Button } from "./ui.js";
import { successFeel } from "../feel.js";

const SHAKES = 7;

function Reveal({ pet, walked, onClose }) {
  const [hatched, setHatched] = useState(false);
  const [shake] = useState(() => new Animated.Value(0));
  const [flash] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));
  const [ring] = useState(() => new Animated.Value(0));
  const rarity = rarityOf(pet);

  useEffect(() => {
    let ringLoop = null;
    const showPet = (animate) => {
      setHatched(true);
      successFeel();
      AccessibilityInfo.announceForAccessibility(`Your egg hatched! Meet ${pet.name}, a ${rarity.label} ${pet.petClass}.`);
      if (!animate) {
        pop.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, speed: 8, bounciness: 14, useNativeDriver: true }),
      ]).start();
      ringLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      );
      ringLoop.start();
    };

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        showPet(false);
        return;
      }
      // Shakes get faster as the egg is about to crack.
      const shakes = Array.from({ length: SHAKES }, (_, i) => {
        const ms = 130 - i * 12;
        return Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: ms, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: ms, useNativeDriver: true }),
        ]);
      });
      Animated.sequence([
        Animated.delay(250),
        ...shakes,
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start(() => showPet(true));
    });
    return () => ringLoop?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per pet (the parent keys this by pet id)
  }, []);

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ["-14deg", "14deg"] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  return (
    <View style={styles.backdrop}>
      {hatched ? (
        <View style={styles.center}>
          <View style={styles.stage}>
            <Animated.View style={[styles.ring, { backgroundColor: rarity.color, opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <PetArt pet={pet} size={190} />
            </Animated.View>
          </View>
          <Animated.View style={[styles.center, { opacity: pop }]}>
            <Text style={[styles.rarity, { color: rarity.color }]}>{rarity.label}</Text>
            <RarityMark mark={rarity.mark} color={rarity.color} size={28} label={rarity.label} />
            <Text style={styles.name}>{pet.name}</Text>
            <Text style={styles.detail}>{`${pet.petClass} · ⚡ ${petPower(pet, walked)} power`}</Text>
            {pet.spaceBorn && <Text style={styles.space}>🛰️ Hatched while the ISS was overhead!</Text>}
            <Button title={`Meet ${pet.name}!`} size="large" onPress={onClose} style={styles.button} />
          </Animated.View>
        </View>
      ) : (
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <EggArt size={170} />
          </Animated.View>
          <Text style={styles.waiting}>Something is hatching…</Text>
        </View>
      )}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
    </View>
  );
}

// Mounted only while a pet is hatching: iOS shows one Modal at a time, so an
// idle (hidden) Modal must not sit around blocking the 3D and landmark screens.
export function HatchModal({ pet, walked, onClose }) {
  if (!pet) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Reveal key={pet.id} pet={pet} walked={walked} onClose={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(22,53,40,0.94)", alignItems: "center", justifyContent: "center", padding: space.xl },
  center: { alignItems: "center", gap: space.sm },
  stage: { width: 240, height: 240, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 220, height: 220, borderRadius: 110 },
  rarity: { fontFamily: fonts.black, fontSize: 22, letterSpacing: 4, textTransform: "uppercase" },
  name: { ...type.display, color: colors.white },
  detail: { ...type.body, color: colors.iceSoft },
  space: { ...type.label, color: colors.ice },
  waiting: { ...type.heading, color: colors.white, marginTop: space.lg },
  button: { marginTop: space.lg },
  flash: { backgroundColor: colors.white },
});
