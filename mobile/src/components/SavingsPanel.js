// Walk-instead-of-ride savings: the growing tree, recent walks, and Nessie.
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { treeSvg } from "../core/art.js";
import { MIN_TRIP_M, formatDollars, totalSaved, treeStage } from "../core/savings.js";
import { colors, fonts, radius } from "../theme.js";
import { Button, Hint, SectionTitle } from "./ui.js";

const RECENT_TRIPS = 8;

export function SavingsPanel({ state, game }) {
  const [key, setKey] = useState("");
  const saved = totalSaved(state.trips);
  const stage = treeStage(saved);

  const connect = async () => {
    if (await game.connectBank(key)) setKey("");
  };

  return (
    <View>
      <View style={styles.hero}>
        <SvgXml xml={treeSvg(stage.index)} width={130} height={130} />
        <View style={styles.heroText}>
          <Text style={styles.total}>{`${formatDollars(saved)} saved by walking`}</Text>
          <Text style={styles.stage}>
            {stage.next
              ? `${stage.current.emoji} ${stage.current.name} · ${formatDollars(stage.next.min - saved)} to ${stage.next.emoji} ${stage.next.name}`
              : `${stage.current.emoji} ${stage.current.name} · fully grown!`}
          </Text>
          <Hint>{`Every walk over ${MIN_TRIP_M} m counts as a rideshare trip you skipped. The fare is an estimate, not a real Uber price.`}</Hint>
        </View>
      </View>

      <SectionTitle>Recent walks</SectionTitle>
      {state.trips.length === 0 ? (
        <Hint>No walks yet. Walk somewhere instead of riding to plant your first savings.</Hint>
      ) : (
        state.trips.slice(0, RECENT_TRIPS).map((trip, i) => (
          <View key={trip.id} style={[styles.trip, i % 2 === 0 && styles.stripe]}>
            <View style={styles.tripInfo}>
              <Text style={styles.tripPlace} numberOfLines={1}>{trip.title}</Text>
              <Hint>{`${Math.round(trip.meters)} m · ${trip.nessieId ? "✓ Nessie" : "local"}`}</Hint>
            </View>
            <Text style={styles.amount}>{`+${formatDollars(trip.amount)}`}</Text>
          </View>
        ))
      )}

      <SectionTitle>Capital One Nessie</SectionTitle>
      <Hint>
        {state.bank
          ? `Connected · savings account …${state.bank.savingsId.slice(-4)}`
          : "Not connected. Savings are tracked in the app (demo mode)."}
      </Hint>
      {!state.bank && (
        <View style={styles.form}>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="Paste your Nessie API key"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Nessie API key"
            style={styles.input}
          />
          <Button title="Connect" onPress={connect} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", gap: 14, alignItems: "center" },
  heroText: { flex: 1, gap: 4 },
  total: { fontSize: 22, fontFamily: fonts.extrabold, color: colors.leafDark },
  stage: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  trip: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 8, borderRadius: radius.small },
  stripe: { backgroundColor: colors.stripe },
  tripInfo: { flex: 1 },
  tripPlace: { fontFamily: fonts.semibold, color: colors.ink },
  amount: { fontFamily: fonts.extrabold, color: colors.leafDark },
  form: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
    fontFamily: fonts.semibold,
  },
});
