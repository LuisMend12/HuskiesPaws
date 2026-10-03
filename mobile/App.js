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
import { Suspense, lazy, useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AlbumPanel } from "./src/components/AlbumPanel.js";
import { CaptureModal } from "./src/components/CaptureModal.js";
import { HatchModal } from "./src/components/HatchModal.js";
import { MapControls, MapTopBar, SHEET_OVERLAP } from "./src/components/MapControls.js";
import { PetsPanel } from "./src/components/PetsPanel.js";
import { petsView } from "./src/components/fakeData.js";
import { capturePetOf, finderOf } from "./src/components/petStatus.js";
import { xpBoostOf } from "./src/components/landmarks.js";
import { PostcardModal } from "./src/components/PostcardModal.js";
import { RanksPanel } from "./src/components/RanksPanel.js";
import { SavingsPanel } from "./src/components/SavingsPanel.js";
import { SquadPanel } from "./src/components/SquadPanel.js";
import { StatusToast } from "./src/components/StatusToast.js";
import { TrailMap } from "./src/components/TrailMap.js";
import { Hint, PillTabs } from "./src/components/ui.js";
import { rankFor } from "./src/core/rank.js";
import { createGame } from "./src/game/game.js";
import { scoreOf } from "./src/game/state.js";
import { useStore } from "./src/game/store.js";
import { colors, radius, shadow, space, type } from "./src/theme.js";

SplashScreen.preventAutoHideAsync(); // keep the navy splash up until the fonts load

// The landmark screen pulls in three.js, so it loads only when opened.
const LandmarkView = lazy(() => import("./src/components/LandmarkView.js"));

const TABS = [
  { id: "squad", label: "Squad" },
  { id: "pets", label: "Pets" },
  { id: "ranks", label: "Ranks" },
  { id: "savings", label: "Savings" },
  { id: "album", label: "Album" },
];
const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

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

  const { pets, squad } = petsView(state);
  const score = scoreOf(state);
  const { current } = rankFor(score);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.map}>
        <TrailMap state={state} onOpenLandmark={(landmarkOpen) => game.set({ landmarkOpen })} />
        <MapTopBar rank={current} score={score} boost={xpBoostOf(state)} onRankPress={() => game.set({ tab: "ranks" })} />
        <StatusToast message={state.status} />
        <MapControls state={state} game={game} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.stats}>
            {[
              plural(state.progress.steps, "step"),
              plural(state.blooms.length, "bloom"),
              plural(state.progress.landmarksFound, "landmark"),
            ].join(" · ")}
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
          {state.tab === "squad" && <SquadPanel state={state} game={game} />}
          {state.tab === "pets" && <PetsPanel state={state} game={game} />}
          {state.tab === "ranks" && <RanksPanel state={state} game={game} />}
          {state.tab === "savings" && <SavingsPanel state={state} game={game} />}
          {state.tab === "album" && <AlbumPanel album={state.album} />}
        </ScrollView>
      </View>

      <PostcardModal
        key={state.discovery?.place.id}
        visible={state.postcardOpen}
        discovery={state.discovery}
        pet={finderOf(state.discovery, pets, squad)}
        onClose={() => game.set({ postcardOpen: false })}
        onGo={game.guideToDiscovery}
        onReplay={game.replayMemo}
      />
      {state.landmarkOpen && (
        <Suspense fallback={null}>
          <LandmarkView state={state} game={game} landmarkId={state.landmarkOpen} onClose={() => game.set({ landmarkOpen: null })} />
        </Suspense>
      )}
      <HatchModal
        pet={state.hatching}
        walked={state.progress.walked}
        onClose={() => (game.closeHatch ? game.closeHatch() : game.set({ hatching: null }))}
      />
      <CaptureModal
        visible={state.captureOpen}
        place={state.capturable}
        pet={capturePetOf(squad)}
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
