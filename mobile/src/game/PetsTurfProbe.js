// Plain proof that pets, eggs, turf HP and live boards work.
// Presentation owns the styled screens in src/components/.
import { Modal, Text, View } from "react-native";
import { eggProgress, metersToHatch, petPower, rarityOf } from "../core/pets.js";
import { Button, Hint } from "../components/ui.js";

export function PetsTurfProbe({ state, game }) {
  const walked = state.progress.walked;
  const pets = state.pets ?? [];
  const egg = state.egg;
  const hatchPct = egg ? Math.round(eggProgress(egg, walked) * 100) : 0;

  return (
    <View>
      <Hint>{`XP boost ${state.xpBoost.toFixed(1)}× · walk XP ${Math.floor(state.progress.walkXp ?? 0)}`}</Hint>
      <Hint>
        {egg
          ? `🥚 Egg ${hatchPct}% · ${metersToHatch(egg, walked)} m to hatch`
          : `No egg yet (${state.eggsReceived} found). Eggs come from walking, never from savings.`}
      </Hint>
      {state.issOverhead ? <Hint>🛰️ ISS overhead — rarer hatches</Hint> : null}
      {pets.length === 0 ? <Hint>No pets yet. Walk to earn an egg, then keep walking to hatch it.</Hint> : null}
      {pets.map((pet) => (
        <View key={pet.id}>
          <Text>{`${pet.id === state.activePetId ? "▶ " : ""}${pet.name} · ${rarityOf(pet).label} ${pet.petClass} · ⚡${petPower(pet, walked)}${pet.spaceBorn ? " 🛰️" : ""}`}</Text>
          <Button title="Set active" variant="secondary" onPress={() => game.setActivePet(pet.id)} />
        </View>
      ))}
      <Button title="Hatch egg now" variant="secondary" onPress={game.hatchEgg} />

      <Hint>Turf (live from the server when EXPO_PUBLIC_API_URL is set)</Hint>
      {(state.turf ?? []).map((t) => (
        <Text key={t.landmarkId}>
          {`${t.mine ? "You" : t.ownerName} · ${t.title} · ${t.pet?.name ?? "?"} HP ${t.hp}/${t.maxHp}`}
        </Text>
      ))}
      <Button
        title={state.capturable ? `Claim ${state.capturable.title}` : "Claim nearby landmark"}
        onPress={() => game.claimTurf(state.capturable?.id)}
        disabled={!state.capturable}
      />
      {state.leaderboard ? (
        <Hint>{`Live ${state.leaderboard.scope} board · ${state.leaderboard.rows.length} rows`}</Hint>
      ) : (
        <Hint>Leaderboard is sample data until the server is reachable.</Hint>
      )}

      <Modal visible={Boolean(state.hatching)} transparent animationType="fade" onRequestClose={game.closeHatch}>
        <View>
          <Text>🐣 Your egg hatched!</Text>
          <Text>{state.hatching?.name}</Text>
          <Hint>{state.hatching ? `${rarityOf(state.hatching).label} ${state.hatching.petClass}` : ""}</Hint>
          <Button title="Welcome to the pack!" onPress={game.closeHatch} />
        </View>
      </Modal>
    </View>
  );
}
