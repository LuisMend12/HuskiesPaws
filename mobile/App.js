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
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, LogBox, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AlbumPanel } from "./src/components/AlbumPanel.js";
import { CaptureModal } from "./src/components/CaptureModal.js";
import { HatchModal } from "./src/components/HatchModal.js";
import { Loading3D } from "./src/components/Loading3D.js";
import { startHeartbeat } from "./src/diag.js";
import { MapControls, MapTopBar, SHEET_OVERLAP, loadSquadView } from "./src/components/MapControls.js";
import { PetsPanel } from "./src/components/PetsPanel.js";
import { petsView } from "./src/components/fakeData.js";
import { capturePetOf, finderOf } from "./src/components/petStatus.js";
import { xpBoostOf } from "./src/components/landmarks.js";
import { PostcardModal } from "./src/components/PostcardModal.js";
import { RanksPanel } from "./src/components/RanksPanel.js";
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
LogBox.ignoreLogs(["Server voice unavailable"]); // expected fallback when /api/voice is unreachable

// The landmark screen pulls in three.js, so it loads only when opened.
const loadLandmarkView = () => import("./src/components/LandmarkView.js");
const REOPEN_GUARD_MS = 1500; // see openLandmark below
const PRELOAD_3D_MS = 4000; // after start-up, fetch the 3D screens' code so their first open is quick

const TABS = [
  { id: "squad", label: "Squad", icon: "🐾" },
  { id: "pets", label: "Pets", icon: "🥚" },
  { id: "ranks", label: "Ranks", icon: "🏅" },
  { id: "album", label: "Album", icon: "📸" },
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
  const [squadOpen, setSquadOpen] = useState(false);
  const [LandmarkScreen, setLandmarkScreen] = useState(null);
  const [SquadScreen, setSquadScreen] = useState(null);
  const hideMap = Boolean(state.landmarkOpen) || squadOpen;

  // Closing a landmark resets the map's bag markers, and iOS re-selects the bag
  // that was tapped, which fired a new "open": the screen reopened by itself
  // (seen in the diag log) and looked frozen. Ignore re-opening the same
  // landmark for a moment after it closes.
  const closedLandmark = useRef({ id: null, at: 0 });
  const openLandmark = (id) => {
    const { id: lastId, at } = closedLandmark.current;
    if (id === lastId && Date.now() - at < REOPEN_GUARD_MS) return;
    game.set({ landmarkOpen: id });
  };
  const closeLandmark = () => {
    closedLandmark.current = { id: state.landmarkOpen, at: Date.now() };
    game.set({ landmarkOpen: null });
  };

  useEffect(() => {
    startHeartbeat();
    // Best effort: if this fails, tapping a 3D button loads the code then.
    const timer = setTimeout(() => {
      loadSquadView().then((mod) => setSquadScreen(() => mod.default)).catch(() => {});
      loadLandmarkView().then((mod) => setLandmarkScreen(() => mod.default)).catch(() => {});
    }, PRELOAD_3D_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!state.landmarkOpen || LandmarkScreen) return undefined;
    const timer = setTimeout(() => {
      loadLandmarkView().then((mod) => setLandmarkScreen(() => mod.default)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [state.landmarkOpen, LandmarkScreen]);

  useEffect(() => {
    if (!squadOpen || SquadScreen) return undefined;
    const timer = setTimeout(() => {
      loadSquadView().then((mod) => setSquadScreen(() => mod.default)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [squadOpen, SquadScreen]);

  useEffect(() => {
    game.load().catch(() => game.set({ status: "Couldn't load progress. Restart the app to try again." }));
    const timer = setInterval(() => {
      if (AppState.currentState === "active") game.refreshOnline();
    }, 15_000);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        game.resumeTracking?.();
        game.refreshOnline();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
      game.dispose();
    };
  }, [game]);

  const { pets, squad } = petsView(state);
  const score = scoreOf(state);
  const { current } = rankFor(score);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.map}>
        {hideMap ? <View style={styles.mapPaused} /> : (
          <TrailMap
            state={state}
            onOpenLandmark={openLandmark}
            onUserExplore={() => game.set({ followCamera: false })}
          />
        )}
        <MapTopBar rank={current} score={score} boost={xpBoostOf(state)} onRankPress={() => game.set({ tab: "ranks" })} />
        <StatusToast message={state.status} />
        <MapControls state={state} game={game} onSquadOpen={setSquadOpen} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.stats} accessibilityRole="text">
            {[
              plural(state.progress.steps, "step"),
              plural(state.blooms.length, "bloom"),
              plural(state.progress.landmarksFound, "landmark"),
            ].join(" · ")}
          </Text>
          <Pressable
            onPress={() => game.set({ demoMode: !state.demoMode })}
            accessibilityRole="switch"
            accessibilityState={{ checked: state.demoMode }}
            accessibilityLabel="Demo mode"
            accessibilityHint="When on, Take me there walks are simulated indoors"
            style={styles.demoRow}
          >
            <View style={styles.flex}>
              <Text style={styles.demoLabel}>{state.demoMode ? "Demo walks" : "Real walks"}</Text>
              <Hint>{state.demoMode ? "Indoor judging: the trail blooms for you" : "Walk to the place yourself"}</Hint>
            </View>
            <Switch
              value={state.demoMode}
              onValueChange={(demoMode) => game.set({ demoMode })}
              trackColor={{ true: colors.green, false: colors.border }}
              pointerEvents="none"
            />
          </Pressable>
        </View>
        <PillTabs tabs={TABS} active={state.tab} onChange={(tab) => game.set({ tab })} />
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}>
          {state.tab === "squad" && <SquadPanel state={state} game={game} />}
          {state.tab === "pets" && <PetsPanel state={state} game={game} />}
          {state.tab === "ranks" && <RanksPanel state={state} game={game} />}
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
      {state.landmarkOpen ? (
        LandmarkScreen
          ? <LandmarkScreen state={state} game={game} landmarkId={state.landmarkOpen} onClose={closeLandmark} />
          : <Loading3D label="Opening landmark…" />
      ) : null}
      {squadOpen ? (
        SquadScreen
          ? <SquadScreen visible squad={squad} onClose={() => setSquadOpen(false)} />
          : <Loading3D label="Loading your squad…" />
      ) : null}
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
  mapPaused: { flex: 1, backgroundColor: "#cfe8b8" },
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
  demoRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.xs },
  demoLabel: { ...type.label },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.xs, gap: space.sm },
});
