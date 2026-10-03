import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AlbumPanel } from "./src/components/AlbumPanel.js";
import { AgentList } from "./src/components/AgentList.js";
import { CaptureModal } from "./src/components/CaptureModal.js";
import { PostcardModal } from "./src/components/PostcardModal.js";
import { RanksPanel } from "./src/components/RanksPanel.js";
import { SavingsPanel } from "./src/components/SavingsPanel.js";
import { TrailMap } from "./src/components/TrailMap.js";
import { Button, Hint } from "./src/components/ui.js";
import { AGENTS, levelFor } from "./src/core/agents.js";
import { rankFor } from "./src/core/rank.js";
import { createGame } from "./src/game/game.js";
import { scoreOf } from "./src/game/state.js";
import { useStore } from "./src/game/store.js";
import { colors } from "./src/theme.js";

const TABS = [
  { id: "squad", label: "Squad" },
  { id: "ranks", label: "Ranks" },
  { id: "savings", label: "Savings" },
  { id: "album", label: "Album" },
];
const scout = AGENTS.find((a) => a.id === "scout");

export default function App() {
  const game = useMemo(() => createGame(), []);
  const state = useStore(game.store);

  useEffect(() => {
    game.load();
  }, [game]);

  const score = scoreOf(state);
  const { current } = rankFor(score);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.topbar}>
          <View style={styles.brandRow} accessibilityRole="header">
            <Image source={require("./assets/logo-badge.png")} style={styles.logo} accessibilityIgnoresInvertColors />
            <Text style={styles.brand}>
              Huskies<Text style={styles.brandAccent}>Paws</Text>
            </Text>
          </View>
          <Pressable style={styles.badge} onPress={() => game.set({ tab: "ranks" })} accessibilityRole="button" accessibilityLabel="Your rank">
            <Text style={styles.badgeText}>{`${current.emoji} ${current.name} · ${score} pts`}</Text>
          </Pressable>
        </View>

        <View style={styles.map}>
          <TrailMap state={state} />
        </View>

        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
          <View style={styles.controls}>
            <Button title="📍 Live location" variant="secondary" onPress={game.startLiveLocation} disabled={state.liveLocation} />
            <Button title="🚶 Demo walk" variant="secondary" onPress={game.demoWalk} disabled={state.walking} />
            <Button
              title={state.capturable ? `📸 Capture ${state.capturable.title}` : "📸 Capture"}
              onPress={() => game.set({ captureOpen: true })}
              disabled={!state.capturable || state.walking}
            />
          </View>
          <View style={styles.demoRow}>
            <Hint style={styles.flex}>
              {state.demoMode ? "Demo mode: guided walks are simulated (for indoor judging)." : "Real walks: walk to the place and Fern will notice when you arrive."}
            </Hint>
            <Switch value={state.demoMode} onValueChange={(demoMode) => game.set({ demoMode })} accessibilityLabel="Demo mode" />
          </View>
          <Hint>{`${state.progress.steps.toLocaleString()} steps · ${state.blooms.length} blooms · ${state.progress.landmarksFound} landmarks`}</Hint>

          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => game.set({ tab: tab.id })}
                accessibilityRole="tab"
                accessibilityState={{ selected: state.tab === tab.id }}
                style={[styles.tab, state.tab === tab.id && styles.tabActive]}
              >
                <Text style={[styles.tabText, state.tab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>

          {state.tab === "squad" && <AgentList state={state} onAction={game.runAgent} />}
          {state.tab === "ranks" && <RanksPanel state={state} game={game} />}
          {state.tab === "savings" && <SavingsPanel state={state} game={game} />}
          {state.tab === "album" && <AlbumPanel album={state.album} />}

          <Text style={styles.status} accessibilityLiveRegion="polite">{state.status}</Text>
        </ScrollView>

        <PostcardModal
          visible={state.postcardOpen}
          discovery={state.discovery}
          onClose={() => game.set({ postcardOpen: false })}
          onGo={game.guideToDiscovery}
          onReplay={game.replayMemo}
        />
        <CaptureModal
          visible={state.captureOpen}
          place={state.capturable}
          agent={scout}
          level={levelFor(state.xp.scout)}
          onSave={game.saveCapture}
          onClose={() => game.set({ captureOpen: false })}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brandNavy },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32 },
  brand: { color: "#fff", fontSize: 19, fontWeight: "800" },
  brandAccent: { color: colors.brandGreen },
  badge: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { color: "#fff", fontSize: 13 },
  map: { flex: 1, minHeight: 260 },
  sheet: { flex: 1, backgroundColor: colors.card },
  sheetContent: { padding: 16, paddingBottom: 40, gap: 8 },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.leaf },
  tabText: { color: colors.muted, fontSize: 15 },
  tabTextActive: { color: colors.leafDark, fontWeight: "700" },
  status: { color: colors.muted, fontSize: 14, marginTop: 8 },
});
