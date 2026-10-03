// Postcard an agent brings back from an expedition.
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { AGENTS } from "../core/agents.js";
import { postcardSvg } from "../core/art.js";
import { colors, fonts, radius } from "../theme.js";
import { Button, Hint } from "./ui.js";

export function PostcardModal({ visible, discovery, onClose, onGo, onReplay }) {
  if (!discovery) return null;
  const agent = AGENTS.find((a) => a.id === discovery.agentId);
  const { place, summary } = discovery;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView>
            <SvgXml xml={postcardSvg(place.title, agent)} width="100%" height={160} />
            <View style={styles.body}>
              <Text style={styles.from}>{`POSTCARD FROM ${(discovery.agentName ?? agent.name).toUpperCase()}`}</Text>
              <Text style={styles.title}>{place.title}</Text>
              {summary.photo && <Image source={{ uri: summary.photo }} style={styles.photo} accessibilityLabel={`Photo of ${place.title}`} />}
              <Text style={styles.fact}>{summary.extract || "No description available."}</Text>
              <Hint>{`${Math.round(place.distance)} m away`}</Hint>
              <Text style={styles.link} onPress={() => Linking.openURL(summary.url)} accessibilityRole="link">
                Source: Wikipedia
              </Text>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button title="🔊 Replay" variant="secondary" onPress={onReplay} />
            <Button title="Take me there" onPress={onGo} />
            <Button title="Later" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(44,58,42,0.45)", justifyContent: "center", padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: "hidden", maxHeight: "90%" },
  body: { padding: 14, gap: 6 },
  from: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted, letterSpacing: 1 },
  title: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.ink },
  photo: { width: "100%", height: 150, borderRadius: radius.small },
  fact: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink, lineHeight: 21 },
  link: { fontFamily: fonts.bold, color: colors.leafDark, textDecorationLine: "underline", fontSize: 13 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, paddingTop: 4 },
});
