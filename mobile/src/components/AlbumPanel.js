// Album of captured landmark postcards.
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../theme.js";
import { AlbumIcon } from "./GameIcons.js";
import { EmptyState } from "./ui.js";

export function AlbumPanel({ album }) {
  if (album.length === 0) {
    return (
      <EmptyState
        icon={<AlbumIcon size={40} />}
        title="No postcards yet"
        body="Explore with a Scout, walk to the place, then tap Capture when you arrive."
      />
    );
  }
  return (
    <View style={styles.grid}>
      {album.map((card) => (
        <View key={card.id} style={styles.card}>
          <Image source={{ uri: card.image }} style={styles.image} accessibilityLabel={`Postcard of ${card.title}`} />
          <Text style={styles.caption} numberOfLines={1}>{card.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    borderRadius: radius.small,
    overflow: "hidden",
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  image: { width: "100%", aspectRatio: 0.8 },
  caption: { fontFamily: fonts.bold, fontSize: 12, padding: 6, color: colors.ink },
});
