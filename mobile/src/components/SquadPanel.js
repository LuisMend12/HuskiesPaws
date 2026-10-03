// Squad tab: the pets you take with you, each with a status and its class's
// action. Slots grow with your league (3, then 4 at Gold, 5 at Crystal).
// Reads squad / pet.status / squadSize (docs/HANDOFF-backend.md); until the
// backend has them, class actions run the existing Pip/Moss/Fern agents.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AGENTS } from "../core/agents.js";
import { petLevel, petPower, rarityOf } from "../core/pets.js";
import { LEAGUES, leagueOf, rankFor } from "../core/rank.js";
import { scoreOf } from "../game/state.js";
import { colors, fonts, radius, space, type } from "../theme.js";
import { petsView } from "./fakeData.js";
import { landmarksView, reachOf, ringOf } from "./landmarks.js";
import { FoodBagSvg, PetArt } from "./PetArt.js";
import { SLOT_UNLOCKS, squadSizeFor, squadStatuses } from "./petStatus.js";
import { Button, Card, Hint, SectionTitle } from "./ui.js";

const STATUS = {
  "with-you": { label: "🐾 With you", color: colors.greenDark, bg: colors.greenSoft },
  exploring: { label: "🧭 Exploring", color: "#1f6fa8", bg: colors.iceSoft },
  defending: { label: "🛡️ Defending", color: colors.white, bg: colors.navy },
  resting: { label: "💤 Resting", color: colors.muted, bg: colors.stripe },
};

// Seconds until an exploring pet is back, ticking once a second.
function useSecondsLeft(expedition) {
  const [now, setNow] = useState(() => expedition?.startedAt ?? 0);
  useEffect(() => {
    if (!expedition) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expedition]);
  if (!expedition) return null;
  return Math.max(0, Math.ceil((expedition.startedAt + expedition.durationMs - Math.max(now, expedition.startedAt)) / 1000));
}

function SquadCard({ pet, status, agentId, state, game }) {
  const walked = state.progress.walked;
  const agent = AGENTS.find((a) => a.id === agentId);
  const look = STATUS[status] ?? STATUS["with-you"];
  const rarity = rarityOf(pet);
  const guarding = status === "defending" ? state.turf?.find((t) => t.pet?.id === pet.id) : null;
  const busy = status !== "with-you" || state.walking;
  const needsDiscovery = pet.petClass === "Pathfinder" && !state.discovery;
  const trip = status === "exploring" && state.expedition?.agentId === agentId ? state.expedition : null;
  const secondsLeft = useSecondsLeft(trip);
  // Until the backend has runPet, run the class's agent under this pet's name.
  const run = () => (game.runPet ? game.runPet(pet.id) : game.runAgent({ ...agent, name: pet.name }));

  return (
    <Card style={styles.card}>
      <View style={status === "exploring" && styles.away}>
        <PetArt pet={pet} size={60} />
      </View>
      <View style={styles.info}>
        <Text style={type.heading} numberOfLines={1}>{`${pet.name} · Lv ${petLevel(pet, walked)}`}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={{ color: rarity.color }}>{rarity.label}</Text>
          {` ${pet.petClass}`}
        </Text>
        <Text style={styles.power}>{`⚡ ${petPower(pet, walked)} power`}</Text>
        <View style={[styles.status, { backgroundColor: look.bg }]}>
          <Text style={[styles.statusText, { color: look.color }]}>
            {guarding
              ? `${look.label} ${guarding.title}`
              : secondsLeft !== null
                ? `${look.label} · back in ${secondsLeft} s`
                : status === "resting" && pet.restMeters
                  ? `${look.label} · ${Math.ceil(pet.restMeters)} m`
                  : look.label}
          </Text>
        </View>
      </View>
      {status === "exploring" ? (
        <ActivityIndicator color={colors.green} />
      ) : agent ? (
        <Button title={agent.action} onPress={run} disabled={busy || needsDiscovery} />
      ) : (
        <Hint style={styles.guardHint}>Defends landmarks</Hint>
      )}
    </Card>
  );
}

const NEARBY_LANDMARKS = 5;

// The closest landmarks, as a way into the landmark screen besides tapping the map.
function NearbyLandmarks({ state, game }) {
  const nearby = landmarksView(state)
    .map((l) => ({ ...l, meters: reachOf(state, l).meters }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, NEARBY_LANDMARKS);
  if (nearby.length === 0) return null;
  return (
    <>
      <SectionTitle>Landmarks nearby</SectionTitle>
      {nearby.map((l) => (
        <Pressable
          key={l.landmarkId}
          onPress={() => game.set({ landmarkOpen: l.landmarkId })}
          accessibilityRole="button"
          accessibilityLabel={`Open ${l.title}`}
          style={({ pressed }) => [styles.landmark, pressed && styles.pressed]}
        >
          <FoodBagSvg size={28} ring={ringOf(l)} />
          <View style={styles.info}>
            <Text style={type.label} numberOfLines={1}>{l.title}</Text>
            <Text style={styles.meta}>{`${!l.guard ? "Free to claim" : l.guard.mine ? "Yours" : `Held by ${l.guard.ownerName} · ⚡${l.guard.pet.power}`} · ${l.meters} m`}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </>
  );
}

function EmptySlot({ onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.empty}>
      <Text style={styles.emptyText}>＋ Empty slot · pick a pet in the Pets tab</Text>
    </Pressable>
  );
}

export function SquadPanel({ state, game }) {
  const { squad } = petsView(state);
  const tier = LEAGUES.indexOf(leagueOf(rankFor(scoreOf(state)).current));
  const size = squadSizeFor(state, tier);
  const locked = SLOT_UNLOCKS.filter((u) => tier < u.tier);
  const members = squadStatuses(squad.slice(0, size), state);

  return (
    <View style={styles.list}>
      <View style={styles.header}>
        <Text style={type.heading}>{`Your squad · ${members.length}/${size}`}</Text>
        <Hint>Guards still use their slot</Hint>
      </View>
      {members.map(({ pet, status, agentId }) => (
        <SquadCard key={pet.id} pet={pet} status={status} agentId={agentId} state={state} game={game} />
      ))}
      {Array.from({ length: Math.max(0, size - members.length) }, (_, i) => (
        <EmptySlot key={`empty-${i}`} onPress={() => game.set({ tab: "pets" })} />
      ))}
      {locked.map((u) => (
        <View key={u.name} style={[styles.empty, styles.locked]}>
          <Text style={styles.emptyText}>{`🔒 Another slot opens at ${u.name}`}</Text>
        </View>
      ))}
      <NearbyLandmarks state={state} game={game} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  card: { flexDirection: "row", alignItems: "center", gap: space.md },
  away: { opacity: 0.4 },
  info: { flex: 1, gap: 2 },
  meta: { ...type.caption },
  power: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  status: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2, marginTop: 2 },
  statusText: { fontFamily: fonts.bold, fontSize: 12 },
  guardHint: { maxWidth: 70, textAlign: "center" },
  empty: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.card, padding: space.md, alignItems: "center" },
  locked: { backgroundColor: colors.stripe },
  emptyText: { ...type.label, color: colors.muted },
  landmark: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.card, backgroundColor: colors.stripe },
  pressed: { opacity: 0.7 },
  chevron: { fontFamily: fonts.black, fontSize: 22, color: colors.muted },
});
