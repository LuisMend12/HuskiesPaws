// Rank card, trail picker, and local / statewide / national leaderboards.
import { Alert, StyleSheet, Text, View } from "react-native";
import { LEADERBOARD_TOP } from "../core/config.js";
import { SCOPES, buildLeaderboard, demoPlayers, topWithYou } from "../core/leaderboard.js";
import { TRAILS, activeTrail, rankFor } from "../core/rank.js";
import { scoreOf } from "../game/state.js";
import { RankBadge } from "./RankBadge.js";
import { colors, fonts, radius } from "../theme.js";
import { Button, Card, Chip, Hint, SectionTitle } from "./ui.js";

export function RanksPanel({ state, game }) {
  const score = scoreOf(state);
  const { current, next, progress } = rankFor(score);
  const active = activeTrail(score, state.trailChoice);
  const scope = SCOPES.find((s) => s.id === state.scope);
  const regionName = state.region[scope.regionKey];
  const live = state.leaderboard?.scope === state.scope && state.leaderboard?.region === regionName;
  const rows = live ? state.leaderboard.rows : topWithYou(
    buildLeaderboard(demoPlayers(scope, regionName), { id: "you", name: "You", score }),
    LEADERBOARD_TOP,
  );

  const confirmReset = () =>
    Alert.alert("Reset progress?", "This clears your steps, landmarks, album, pets, and eggs.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: game.resetProgress },
    ]);

  return (
    <View>
      <Card style={styles.rankCard}>
        <View style={styles.rankHead}>
          <RankBadge rank={current} size={56} />
          <View style={styles.rankCopy}>
            <Text style={styles.rankTitle}>{current.name}</Text>
            <Text style={styles.rankNext}>
              {next ? `${score.toLocaleString()} XP · ${next.min - score} to ${next.name}` : `${score.toLocaleString()} XP · Top rank`}
            </Text>
          </View>
        </View>
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Hint>
          {`${state.progress.steps.toLocaleString()} steps${state.pedometer ? " (step counter)" : ""} · ${state.progress.landmarksFound} found · ${state.progress.landmarksCaptured} captured`}
        </Hint>
      </Card>

      <SectionTitle>Your trail</SectionTitle>
      <View style={styles.chips}>
        <Chip label="✨ Auto (follows rank)" active={state.trailChoice === "auto"} onPress={() => game.setTrailChoice("auto")} />
        {TRAILS.map((trail) => {
          const unlocked = score >= trail.rank.min;
          return (
            <Chip
              key={trail.id}
              label={unlocked ? `${trail.flowers.slice(0, 2).join("")} ${trail.name}` : `🔒 ${trail.name} · ${trail.rank.name}`}
              active={state.trailChoice === trail.id}
              outlined={state.trailChoice === "auto" && active.id === trail.id}
              disabled={!unlocked}
              onPress={() => game.setTrailChoice(trail.id)}
            />
          );
        })}
      </View>

      <SectionTitle>Leaderboards</SectionTitle>
      <View style={styles.chips}>
        {SCOPES.map((s) => (
          <Chip key={s.id} label={s.label} active={state.scope === s.id} onPress={() => game.set({ scope: s.id })} />
        ))}
      </View>
      <View style={styles.boardHead}>
        <Text style={styles.boardTitle}>{`${scope.label} · ${regionName}`}</Text>
        <View style={[styles.badge, live ? styles.badgeLive : styles.badgeSample]}>
          <Text style={[styles.badgeText, live ? styles.badgeLiveText : styles.badgeSampleText]}>{live ? "LIVE" : "SAMPLE"}</Text>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={row.id ?? `live-${row.position}`} style={[styles.row, i % 2 === 0 && styles.rowStripe, row.isYou && styles.rowYou]}>
          <Text style={styles.pos}>{`#${row.position}`}</Text>
          <RankBadge rank={rankFor(row.score).current} size={26} />
          <Text style={[styles.player, row.isYou && styles.bold]}>{row.isYou ? "You" : row.name}</Text>
          <Text style={[styles.score, row.isYou && styles.bold]}>{row.score.toLocaleString()}</Text>
        </View>
      ))}
      <Hint style={styles.spaced}>{live ? "Live players in your region." : "Sample players: the live leaderboard is unavailable."}</Hint>
      <Button title="Reset my progress" variant="secondary" onPress={confirmReset} style={styles.spaced} />
    </View>
  );
}

const styles = StyleSheet.create({
  rankCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 12 },
  rankHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankTitle: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.ink },
  meter: { height: 10, backgroundColor: colors.soft, borderRadius: 5, marginVertical: 8, overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: colors.leaf },
  rankNext: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginBottom: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  boardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 4 },
  boardTitle: { fontFamily: fonts.bold, color: colors.ink, flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLive: { backgroundColor: colors.greenSoft },
  badgeSample: { backgroundColor: colors.stripe },
  badgeText: { fontFamily: fonts.black, fontSize: 10, letterSpacing: 0.6 },
  badgeLiveText: { color: colors.greenDark },
  badgeSampleText: { color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: radius.small },
  rowStripe: { backgroundColor: colors.stripe },
  rowYou: { backgroundColor: colors.you, borderWidth: 1, borderColor: colors.accent },
  pos: { fontFamily: fonts.bold, width: 44, color: colors.muted },
  player: { fontFamily: fonts.semibold, flex: 1, color: colors.ink },
  score: { fontFamily: fonts.semibold, color: colors.ink },
  bold: { fontFamily: fonts.extrabold },
  spaced: { marginTop: 10 },
});
