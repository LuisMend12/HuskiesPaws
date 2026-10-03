import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AlbumPanel } from "./src/components/AlbumPanel.js";
import { AgentList } from "./src/components/AgentList.js";
import { CaptureModal } from "./src/components/CaptureModal.js";
import { MapControls, MapTopBar, SHEET_OVERLAP } from "./src/components/MapControls.js";
import { PostcardModal } from "./src/components/PostcardModal.js";
import { RanksPanel } from "./src/components/RanksPanel.js";
import { SavingsPanel } from "./src/components/SavingsPanel.js";
import { StatusToast } from "./src/components/StatusToast.js";
import { TrailMap } from "./src/components/TrailMap.js";
import { Hint, PillTabs } from "./src/components/ui.js";
import { AGENTS, levelFor } from "./src/core/agents.js";
import { rankFor } from "./src/core/rank.js";
import { createGame } from "./src/game/game.js";
import { scoreOf } from "./src/game/state.js";
import { useStore } from "./src/game/store.js";
import { colors, radius, shadow, space, type } from "./src/theme.js";

SplashScreen.preventAutoHideAsync(); // keep the navy splash up until the fonts load

const TABS = [
  { id: "squad", label: "Squad" },
  { id: "ranks", label: "Ranks" },
  { id: "savings", label: "Savings" },
  { id: "album", label: "Album" },
];
const scout = AGENTS.find((a) => a.id === "scout");

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = fontsLoaded || Boolean(fontError); // on a font error, carry on with the system font

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const game = useMemo(() => createGame(), []);
  const state = useStore(game.store);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    game.load();
  }, [game]);

  const score = scoreOf(state);
  const { current } = rankFor(score);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.map}>
        <TrailMap state={state} />
        <MapTopBar rank={current} score={score} onRankPress={() => game.set({ tab: "ranks" })} />
        <StatusToast message={state.status} />
        <MapControls state={state} game={game} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.stats}>
            {`${state.progress.steps.toLocaleString()} steps · ${state.blooms.length} blooms · ${state.progress.landmarksFound} landmarks`}
          </Text>
          <View style={styles.demoRow}>
            <Hint style={styles.flex}>{state.demoMode ? "Demo mode: walks are simulated" : "Real walks: go to the place"}</Hint>
            <Switch
              value={state.demoMode}
              onValueChange={(demoMode) => game.set({ demoMode })}
              trackColor={{ true: colors.green, false: colors.border }}
              accessibilityLabel="Demo mode"
            />
          </View>
        </View>
        <PillTabs tabs={TABS} active={state.tab} onChange={(tab) => game.set({ tab })} />
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}>
          {state.tab === "squad" && <AgentList state={state} onAction={game.runAgent} />}
          {state.tab === "ranks" && <RanksPanel state={state} game={game} />}
          {state.tab === "savings" && <SavingsPanel state={state} game={game} />}
          {state.tab === "album" && <AlbumPanel album={state.album} />}
        </ScrollView>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 45 },
  sheet: {
    flex: 55,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadow.raised,
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: space.sm },
  sheetHeader: { paddingHorizontal: space.lg, paddingTop: space.sm },
  stats: { ...type.label, color: colors.muted },
  demoRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.xs, gap: space.sm },
});
