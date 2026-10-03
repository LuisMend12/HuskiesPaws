// Pets standing on the tilted map, like Google Maps' car: your squad follows
// you, an exploring pet walks out to its place and back, and each guard stands
// on its landmark with an HP bar.
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { colors, fonts, radius } from "../theme.js";
import { PetSvg } from "./PetArt.js";

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

function Guard({ turf }) {
  const tracking = useSettled();
  const hp = turf.maxHp ? Math.max(0, Math.min(1, turf.hp / turf.maxHp)) : 1;
  const hpColor = hp > 0.5 ? colors.green : hp > 0.25 ? colors.yellow : colors.coral;
  return (
    <Marker
      coordinate={{ latitude: turf.lat, longitude: turf.lon }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracking}
      title={turf.title}
      description={`${turf.mine ? "Your" : `${turf.ownerName}'s`} ${turf.pet.name} guards it · ⚡${turf.pet.power}`}
    >
      <View style={styles.guard}>
        <View style={[styles.owner, turf.mine ? styles.mine : styles.rival]}>
          <Text style={styles.ownerText} numberOfLines={1}>{turf.mine ? "You" : turf.ownerName}</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFill, { width: `${Math.round(hp * 100)}%`, backgroundColor: hpColor }]} />
        </View>
        <View style={[styles.base, turf.mine ? styles.baseMine : styles.baseRival]}>
          <PetSvg pet={turf.pet} size={48} />
        </View>
      </View>
    </Marker>
  );
}

// squad: [{ pet, status, agentId }] from squadStatuses().
export function MapPets({ position, squad, turf, expedition }) {
  const following = squad.filter((s) => s.status === "with-you").map((s) => s.pet).slice(0, FOLLOW_SPOTS.length);
  const explorer = expedition ? squad.find((s) => s.status === "exploring" && s.agentId === expedition.agentId)?.pet : null;
  return (
    <>
      {turf.map((t) => (
        <Guard key={`turf-${t.landmarkId}`} turf={t} />
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
  guard: { alignItems: "center", width: 84 },
  owner: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, maxWidth: 84 },
  mine: { backgroundColor: colors.green },
  rival: { backgroundColor: colors.navy },
  ownerText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
  hpTrack: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(11,31,58,0.25)", marginTop: 2, overflow: "hidden" },
  hpFill: { height: "100%", borderRadius: 3 },
  base: { borderRadius: 30, borderWidth: 3, padding: 2, marginTop: 2, backgroundColor: "rgba(255,255,255,0.75)" },
  baseMine: { borderColor: colors.green },
  baseRival: { borderColor: colors.coral },
});
