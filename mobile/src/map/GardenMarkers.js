import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";
import { colors, fonts, radius } from "../theme.js";
import { petsView } from "../components/fakeData.js";
import { hpNow, landmarksView, ringOf } from "../components/landmarks.js";
import { FoodSvg, PetSvg } from "../components/PetArt.js";
import { squadStatuses } from "../components/petStatus.js";

const METERS_PER_DEGREE = 111320;
const FOLLOW_SPOTS = [
  [-14, -10],
  [14, -10],
  [0, -20],
  [-24, -22],
  [24, -22],
];
const OUT_SHARE = 0.6;
const TICK_MS = 120;
const ease = (f) => (f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2);
const lngLatOf = (p) => [p.lon, p.lat];
const offset = ({ lat, lon }, [east, north]) => [
  lon + east / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180)),
  lat + north / METERS_PER_DEGREE,
];
const between = (a, b, f) => ({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f });

function placeOnTrip({ from, to, startedAt, durationMs }, home, now) {
  const t = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
  return t < OUT_SHARE ? between(from, to, ease(t / OUT_SHARE)) : between(to, home, ease((t - OUT_SHARE) / (1 - OUT_SHARE)));
}

function BloomMarker({ bloom }) {
  return (
    <Marker id={`bloom-${bloom.id}`} lngLat={lngLatOf(bloom)} anchor="center">
      <Text style={styles.bloom}>{bloom.emoji}</Text>
    </Marker>
  );
}

function PlayerMarker({ position }) {
  return (
    <Marker id="you" lngLat={lngLatOf(position)} anchor="center">
      <View style={styles.meWrap}>
        <View style={styles.meHalo} />
        <View style={styles.me} />
      </View>
    </Marker>
  );
}

function LandmarkMarker({ landmark, onOpen }) {
  const guard = landmark.guard;
  const ring = ringOf(landmark);
  const hp = guard?.maxHp ? Math.max(0, Math.min(1, hpNow(guard) / guard.maxHp)) : 1;
  const hpColor = hp > 0.5 ? colors.green : hp > 0.25 ? colors.yellow : colors.coral;
  return (
    <Marker
      id={`landmark:${landmark.landmarkId}`}
      lngLat={lngLatOf(landmark)}
      anchor="bottom"
      onPress={() => onOpen?.(landmark.landmarkId)}
    >
      <View style={styles.landmark}>
        {guard && (
          <>
            <View style={[styles.owner, guard.mine ? styles.mine : styles.rival]}>
              <Text style={styles.ownerText} numberOfLines={1}>
                {guard.mine ? "You" : guard.ownerName}
              </Text>
            </View>
            <View style={styles.hpTrack}>
              <View style={[styles.hpFill, { width: `${Math.round(hp * 100)}%`, backgroundColor: hpColor }]} />
            </View>
          </>
        )}
        <View style={styles.landmarkRow}>
          {guard && <PetSvg pet={guard.pet} size={44} />}
          <FoodSvg size={guard ? 34 : 38} ring={ring} kind={landmark.food} />
        </View>
      </View>
    </Marker>
  );
}

function ExplorerMarker({ pet, expedition, home }) {
  const [now, setNow] = useState(expedition.startedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const at = placeOnTrip(expedition, home, now);
  return (
    <>
      <Marker id="explore-dest" lngLat={lngLatOf(expedition.to)} anchor="center">
        <View style={styles.mystery}>
          <Text style={styles.mysteryText}>?</Text>
        </View>
      </Marker>
      <Marker id={`explore-${pet.id}`} lngLat={lngLatOf(at)} anchor="bottom">
        <PetSvg pet={pet} size={46} />
      </Marker>
    </>
  );
}

export function GardenMarkers({ state, onOpenLandmark }) {
  const { squad } = petsView(state);
  const landmarks = landmarksView(state);
  const statuses = squadStatuses(squad, state);
  const following = statuses.filter((s) => s.status === "with-you").map((s) => s.pet).slice(0, FOLLOW_SPOTS.length);
  const explorer = state.expedition
    ? statuses.find((s) => s.status === "exploring" && s.agentId === state.expedition.agentId)?.pet
    : null;
  return (
    <>
      {state.blooms.map((bloom) => (
        <BloomMarker key={`bloom-${bloom.id}`} bloom={bloom} />
      ))}
      {landmarks.map((l) => (
        <LandmarkMarker
          key={`landmark-${l.landmarkId}-${ringOf(l)}-${l.guard?.pet.id ?? ""}`}
          landmark={l}
          onOpen={onOpenLandmark}
        />
      ))}
      {explorer && <ExplorerMarker key={`explore-${state.expedition.startedAt}`} pet={explorer} expedition={state.expedition} home={state.position} />}
      {following.map((pet, i) => (
        <Marker key={`squad-${pet.id}`} id={`squad-${pet.id}`} lngLat={offset(state.position, FOLLOW_SPOTS[i])} anchor="bottom">
          <PetSvg pet={pet} size={42} />
        </Marker>
      ))}
      <PlayerMarker position={state.position} />
    </>
  );
}

const styles = StyleSheet.create({
  bloom: { fontSize: 16 },
  meWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  meHalo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(46,157,79,0.28)",
  },
  me: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.leafDark,
    borderWidth: 3,
    borderColor: "#fff",
  },
  mystery: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.navy,
    borderWidth: 3,
    borderColor: colors.ice,
    alignItems: "center",
    justifyContent: "center",
  },
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
