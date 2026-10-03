// The agent squad: Pip (Scout), Moss (Storyteller), Fern (Pathfinder).
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { AGENTS, levelFor } from "../core/agents.js";
import { creatureSvg } from "../core/art.js";
import { colors, fonts, radius } from "../theme.js";
import { Button } from "./ui.js";

export function AgentList({ state, onAction }) {
  return (
    <View style={styles.list}>
      {AGENTS.map((agent) => {
        const level = levelFor(state.xp[agent.id]);
        const isAway = state.away.includes(agent.id);
        const disabled = isAway || state.walking || (agent.id === "pathfinder" && !state.discovery);
        return (
          <View key={agent.id} style={styles.card}>
            <View style={isAway && styles.away}>
              <SvgXml xml={creatureSvg(agent, level)} width={52} height={52} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{`${agent.name} · Lv ${level}`}</Text>
              <Text style={styles.role}>{isAway ? "On an expedition…" : agent.role}</Text>
            </View>
            {isAway ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Button title={agent.action} disabled={disabled} onPress={() => onAction(agent)} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  away: { opacity: 0.35 },
  info: { flex: 1 },
  name: { fontFamily: fonts.bold, color: colors.ink },
  role: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
});
