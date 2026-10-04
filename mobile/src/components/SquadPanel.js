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
import { MAX_HP, READY_HP, healMinutes, landmarksView, reachOf, ringOf } from "./landmarks.js";
import { FoodSvg, PetArt } from "./PetArt.js";
import { SLOT_UNLOCKS, squadSizeFor, squadStatuses } from "./petStatus.js";
import { DirectionsIcon, ExploreIcon, StoryIcon, TerritoryIcon } from "./GameIcons.js";
import { Button, Card, Hint, SectionTitle } from "./ui.js";

const STATUS = {
  "with-you": { label: "With you", color: colors.greenDark, bg: colors.greenSoft },
  exploring: { label: "Exploring", color: "#1f6fa8", bg: colors.iceSoft },
  defending: { label: "Defending", color: colors.white, bg: colors.navy },
  resting: { label: "Healing", color: colors.muted, bg: colors.stripe },
};

const CLASS_ICON = {
  Scout: ExploreIcon,
  Storyteller: StoryIcon,
  Pathfinder: DirectionsIcon,
  Guardian: TerritoryIcon,
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

function SquadCard({ pet, status, agentId, hp, state, game }) {
  const walked = state.progress.walked;
  const agent = AGENTS.find((a) => a.id === agentId);
  const look = STATUS[status] ?? STATUS["with-you"];
  const rarity = rarityOf(pet);
  const guarding = status === "defending" ? state.turf?.find((t) => t.pet?.id === pet.id) : null;
  const busy = status !== "with-you" || state.walking || state.planning;
  const needsDiscovery = pet.petClass === "Pathfinder" && !state.discovery;
  const trip = status === "exploring" && state.expedition?.agentId === agentId ? state.expedition : null;
  const secondsLeft = useSecondsLeft(trip);
  const run = () => (game.runPet ? game.runPet(pet.id) : game.runAgent({ ...agent, name: pet.name }));
  const whyDisabled = needsDiscovery
    ? "Explore with a Scout first"
    : state.walking || state.planning
      ? "Wait until this walk finishes"
      : status !== "with-you"
        ? "This pet is busy"
        : null;
  const actionTitle = needsDiscovery ? "Explore first" : agent?.action;

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
                : status === "resting"
                  ? `Healing · ${Math.floor(hp)} HP · ready in ${healMinutes(hp, READY_HP)} min`
                  : hp < MAX_HP
                    ? `${look.label} · ${Math.floor(hp)} HP`
                    : look.label}
          </Text>
        </View>
      </View>
      {status === "exploring" ? (
        <ActivityIndicator color={colors.green} />
      ) : agent ? (
        <View style={styles.action}>
          <Button title={actionTitle} onPress={run} disabled={busy || needsDiscovery} icon={CLASS_ICON[pet.petClass]} />
          {whyDisabled ? <Hint style={styles.why}>{whyDisabled}</Hint> : null}
        </View>
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
          <FoodSvg size={28} ring={ringOf(l)} kind={l.food} />
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

// Re-renders every few seconds so healing HP counts up.
function useTicker(ms) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(timer);
  }, [ms]);
}

export function SquadPanel({ state, game }) {
  useTicker(5000);
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
      {state.progress.landmarksFound === 0 && state.away.length === 0 && (
        <Card style={styles.coach}>
          <Text style={type.label}>Start here</Text>
          <Hint>Tap Explore on your Scout to find a real place nearby. Then Take me there to bloom the trail.</Hint>
        </Card>
      )}
      {members.map(({ pet, status, agentId, hp }) => (
        <SquadCard key={pet.id} pet={pet} status={status} agentId={agentId} hp={hp} state={state} game={game} />
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
  action: { alignItems: "flex-end", maxWidth: 128, gap: 4 },
  why: { textAlign: "right" },
  coach: { backgroundColor: colors.greenSoft, gap: 4 },
  empty: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.card, padding: space.md, alignItems: "center" },
  locked: { backgroundColor: colors.stripe },
  emptyText: { ...type.label, color: colors.muted },
  landmark: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.card, backgroundColor: colors.stripe },
  pressed: { opacity: 0.7 },
  chevron: { fontFamily: fonts.black, fontSize: 22, color: colors.muted },
});
