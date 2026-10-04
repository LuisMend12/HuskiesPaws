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
import { WelcomeOverlay } from "./src/components/WelcomeOverlay.js";
import { NextStepCard } from "./src/components/NextStep.js";
import { eggIsReady, followNext } from "./src/components/nextCoach.js";
import { AlbumIcon, PetsIcon, RanksIcon, SquadIcon } from "./src/components/GameIcons.js";
import { AppTabs, Hint } from "./src/components/ui.js";
import { tapFeel } from "./src/feel.js";
import { rankFor } from "./src/core/rank.js";
import { createGame } from "./src/game/game.js";
import { scoreOf } from "./src/game/state.js";
import { useStore } from "./src/game/store.js";
import { colors, radius, shadow, space, type } from "./src/theme.js";

SplashScreen.preventAutoHideAsync(); // keep the splash up until the fonts load
LogBox.ignoreLogs(["Server voice unavailable"]); // expected fallback when /api/voice is unreachable

// The landmark screen pulls in three.js, so it loads only when opened.
const loadLandmarkView = () => import("./src/components/LandmarkView.js");
const REOPEN_GUARD_MS = 1500; // see openLandmark below
const PRELOAD_3D_MS = 4000; // after start-up, fetch the 3D screens' code so their first open is quick

const TABS = [
  { id: "squad", label: "Squad", Icon: SquadIcon },
  { id: "pets", label: "Pets", Icon: PetsIcon },
  { id: "ranks", label: "Ranks", Icon: RanksIcon },
  { id: "album", label: "Album", Icon: AlbumIcon },
];
const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

function ProgressStrip({ rank, next, progress, steps, blooms, places }) {
  return (
    <View accessibilityRole="text">
      <View style={styles.progressHead}>
        <Text style={styles.progressRank}>{rank.name}</Text>
        <Text style={styles.progressNext}>{next ? `${Math.round(progress * 100)}% to ${next.name}` : "Top rank"}</Text>
      </View>
      <View style={styles.meter}>
        <View style={[styles.meterFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.stats}>
        {[plural(steps, "step"), plural(blooms, "bloom"), plural(places, "place")].join(" · ")}
      </Text>
    </View>
  );
}

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
  const { current, next, progress } = rankFor(score);

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
        <MapTopBar rank={current} score={score} boost={xpBoostOf(state)} issOverhead={state.issOverhead} onRankPress={() => game.set({ tab: "ranks" })} />
        <StatusToast message={state.status} />
        <MapControls state={state} game={game} onSquadOpen={setSquadOpen} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <NextStepCard state={state} onPress={() => { tapFeel(); followNext(state, game, openLandmark); }} />
          <ProgressStrip rank={current} next={next} progress={progress} steps={state.progress.steps} blooms={state.blooms.length} places={state.progress.landmarksFound} />
          {state.issOverhead && (
            <Text style={styles.issLine}>ISS overhead · rarer hatches right now</Text>
          )}
          {!state.demoMode && !state.liveLocation && (
            <View style={[styles.banner, state.locationIssue === "denied" ? styles.bannerWarn : styles.bannerInfo]}>
              <Text style={styles.bannerTitle}>{state.locationIssue === "denied" ? "Location is off" : "Walk live to bloom the trail"}</Text>
              <Text style={styles.bannerBody}>
                {state.locationIssue === "denied"
                  ? "Allow location, or switch on Demo walks to practice indoors."
                  : "Tap Walk live on the map, or use Demo walks if you're judging indoors."}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => game.set({ demoMode: !state.demoMode })}
            accessibilityRole="switch"
            accessibilityState={{ checked: state.demoMode }}
            accessibilityLabel="Demo walks"
            accessibilityHint="When on, walks to landmarks are simulated so you can play indoors"
            style={[styles.demoRow, state.demoMode ? styles.demoOn : styles.demoOff]}
          >
            <View style={styles.flex}>
              <Text style={styles.demoLabel}>{state.demoMode ? "Demo walks on" : "Real walking"}</Text>
              <Hint>{state.demoMode ? "Routes play themselves — for indoor judging" : "You walk; the trail blooms with you"}</Hint>
            </View>
            <Switch
              value={state.demoMode}
              onValueChange={(demoMode) => game.set({ demoMode })}
              trackColor={{ true: colors.gold, false: colors.border }}
              thumbColor={colors.white}
              pointerEvents="none"
            />
          </Pressable>
        </View>
        <AppTabs
          tabs={TABS}
          active={state.tab}
          badges={{ pets: eggIsReady(state) }}
          onChange={(tab) => { tapFeel(); game.set({ tab }); }}
        />
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}>
          {state.tab === "squad" && <SquadPanel state={state} game={game} onOpenLandmark={openLandmark} />}
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
        demoMode={state.demoMode}
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
      <WelcomeOverlay visible={state.loaded && !state.welcomeSeen} onDismiss={game.dismissWelcome} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 48 },
  mapPaused: { flex: 1, backgroundColor: "#cfe8b8" },
  sheet: {
    flex: 52,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadow.raised,
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: space.sm },
  sheetHeader: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  progressRank: { ...type.label },
  progressNext: { ...type.caption },
  meter: { height: 8, borderRadius: 4, backgroundColor: colors.stripe, overflow: "hidden", marginTop: 4, marginBottom: 4 },
  meterFill: { height: "100%", backgroundColor: colors.green, borderRadius: 4 },
  stats: { ...type.caption },
  issLine: { ...type.label, color: colors.navy, backgroundColor: colors.iceSoft, borderRadius: radius.small, paddingVertical: 6, paddingHorizontal: space.md },
  banner: { borderRadius: radius.small, paddingVertical: space.sm, paddingHorizontal: space.md, gap: 2 },
  bannerWarn: { backgroundColor: "#ffe8e0" },
  bannerInfo: { backgroundColor: colors.iceSoft },
  bannerTitle: { ...type.label },
  bannerBody: { ...type.caption },
  demoRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.small, minHeight: 44 },
  demoOn: { backgroundColor: "#fff3d6" },
  demoOff: { backgroundColor: colors.stripe },
  demoLabel: { ...type.label },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.xs, gap: space.sm },
});
