// Pets standing on the tilted map, like Google Maps' car: your squad follows
// you, an exploring pet walks out to its place and back, and every landmark has
// a food bag on a ring, with its guard pet and HP bar when someone holds it.
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { colors, fonts, radius } from "../theme.js";
import { ringOf } from "./landmarks.js";
import { FoodBagSvg, PetSvg } from "./PetArt.js";

const METERS_PER_DEGREE = 111320;
// Where squad pets stand, in meters from you (east, north): a little group behind you.
const FOLLOW_SPOTS = [[-14, -10], [14, -10], [0, -20], [-24, -22], [24, -22]];

const offset = ({ lat, lon }, [east, north]) => ({
  latitude: lat + north / METERS_PER_DEGREE,
  longitude: lon + east / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180)),
});

// Map markers re-render their view every frame unless tracksViewChanges is off,
// which makes maps slow (worst on Android). Draw once, then freeze.
export function useSettled(ms = 600) {
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracking(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return tracking;
}

function SquadPet({ pet, coordinate }) {
  const tracking = useSettled();
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={tracking} title={pet.name} description="In your squad">
      <PetSvg pet={pet} size={42} />
    </Marker>
  );
}

// An exploring pet spends this share of the trip walking out; the rest walking back.
const OUT_SHARE = 0.6;
const TICK_MS = 100;
const ease = (f) => (f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2);
const between = (a, b, f) => ({ latitude: a.lat + (b.lat - a.lat) * f, longitude: a.lon + (b.lon - a.lon) * f });

function placeOnTrip({ from, to, startedAt, durationMs }, home, now) {
  const t = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
  return t < OUT_SHARE ? between(from, to, ease(t / OUT_SHARE)) : between(to, home, ease((t - OUT_SHARE) / (1 - OUT_SHARE)));
}

function ExplorerPet({ pet, expedition, home }) {
  const tracking = useSettled();
  const [now, setNow] = useState(expedition.startedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const target = { latitude: expedition.to.lat, longitude: expedition.to.lon };
  return (
    <>
      <Polyline coordinates={[{ latitude: home.lat, longitude: home.lon }, target]} strokeColor={colors.ice} strokeWidth={3} lineDashPattern={[2, 8]} />
      <Marker coordinate={target} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracking} title="Somewhere new…">
        <View style={styles.mystery}>
          <Text style={styles.mysteryText}>?</Text>
        </View>
      </Marker>
      <Marker coordinate={placeOnTrip(expedition, home, now)} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={tracking} title={`${pet.name} is exploring`}>
        <PetSvg pet={pet} size={46} />
      </Marker>
    </>
  );
}

// A landmark: its food bag on a ring (grey free, green yours, coral rival), and
// the guard pet with its owner and HP when someone holds it. Tap to open it.
function Landmark({ landmark, onOpen }) {
  const tracking = useSettled();
  const guard = landmark.guard;
  const ring = ringOf(landmark);
  const hp = guard?.maxHp ? Math.max(0, Math.min(1, guard.hp / guard.maxHp)) : 1;
  const hpColor = hp > 0.5 ? colors.green : hp > 0.25 ? colors.yellow : colors.coral;
  return (
    <Marker
      coordinate={{ latitude: landmark.lat, longitude: landmark.lon }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracking}
      onPress={() => onOpen(landmark.landmarkId)}
      accessibilityLabel={`${landmark.title}, ${!guard ? "free" : guard.mine ? "guarded by your pet" : `guarded by ${guard.ownerName}`}`}
    >
      <View style={styles.landmark}>
        {guard && (
          <>
            <View style={[styles.owner, guard.mine ? styles.mine : styles.rival]}>
              <Text style={styles.ownerText} numberOfLines={1}>{guard.mine ? "You" : guard.ownerName}</Text>
            </View>
            <View style={styles.hpTrack}>
              <View style={[styles.hpFill, { width: `${Math.round(hp * 100)}%`, backgroundColor: hpColor }]} />
            </View>
          </>
        )}
        <View style={styles.landmarkRow}>
          {guard && <PetSvg pet={guard.pet} size={44} />}
          <FoodBagSvg size={guard ? 34 : 38} ring={ring} />
        </View>
      </View>
    </Marker>
  );
}

// squad: [{ pet, status, agentId }] from squadStatuses().
// landmarks: from landmarksView(); onOpenLandmark(id) opens the landmark screen.
export function MapPets({ position, squad, landmarks, expedition, onOpenLandmark }) {
  const following = squad.filter((s) => s.status === "with-you").map((s) => s.pet).slice(0, FOLLOW_SPOTS.length);
  const explorer = expedition ? squad.find((s) => s.status === "exploring" && s.agentId === expedition.agentId)?.pet : null;
  return (
    <>
      {landmarks.map((l) => (
        // Keyed by who holds it, so the marker redraws after a claim.
        <Landmark key={`landmark-${l.landmarkId}-${ringOf(l)}-${l.guard?.pet.id ?? ""}`} landmark={l} onOpen={onOpenLandmark} />
      ))}
      {explorer && <ExplorerPet key={`explore-${expedition.startedAt}`} pet={explorer} expedition={expedition} home={position} />}
      {following.map((pet, i) => (
        <SquadPet key={`squad-${pet.id}`} pet={pet} coordinate={offset(position, FOLLOW_SPOTS[i])} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  mystery: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy, borderWidth: 3, borderColor: colors.ice, alignItems: "center", justifyContent: "center" },
  mysteryText: { fontFamily: fonts.black, fontSize: 16, color: colors.white },
  landmark: { alignItems: "center", width: 96 },
  landmarkRow: { flexDirection: "row", alignItems: "flex-end" },
  owner: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, maxWidth: 84 },
  mine: { backgroundColor: colors.green },
  rival: { backgroundColor: colors.navy },
  ownerText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
  hpTrack: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(11,31,58,0.25)", marginTop: 2, overflow: "hidden" },
  hpFill: { height: "100%", borderRadius: 3 },
});
