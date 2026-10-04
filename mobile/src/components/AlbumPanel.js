// Album of captured landmark postcards. Tap a card to see it larger.
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space } from "../theme.js";
import { AlbumIcon } from "./GameIcons.js";
import { Button, EmptyState } from "./ui.js";

export function AlbumPanel({ album, onExplore }) {
  const [open, setOpen] = useState(null);
  if (album.length === 0) {
    return (
      <EmptyState
        icon={<AlbumIcon size={40} />}
        title="No postcards yet"
        body="Explore with a Scout, walk to the place, then tap Capture when you arrive."
        action={onExplore ? { title: "Open Squad", onPress: onExplore } : undefined}
      />
    );
  }
  return (
    <View style={styles.grid}>
      {album.map((card) => (
        <Pressable
          key={`${card.id}-${card.date}`} // older saves can hold two cards for one place
          onPress={() => setOpen(card)}
          accessibilityRole="button"
          accessibilityLabel={`Postcard of ${card.title}`}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Image source={{ uri: card.image }} style={styles.image} accessibilityLabel={`Postcard of ${card.title}`} />
          <Text style={styles.caption} numberOfLines={1}>{card.title}</Text>
          {card.date ? <Text style={styles.date}>{new Date(card.date).toLocaleDateString()}</Text> : null}
        </Pressable>
      ))}
      <Modal visible={Boolean(open)} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.lightbox}>
          {open ? (
            <>
              <Image source={{ uri: open.image }} style={styles.hero} accessibilityLabel={`Postcard of ${open.title}`} />
              <Text style={styles.heroTitle}>{open.title}</Text>
              {open.date ? <Text style={styles.heroDate}>{new Date(open.date).toLocaleDateString()}</Text> : null}
              <Button title="Close" onPress={() => setOpen(null)} />
            </>
          ) : null}
        </View>
      </Modal>
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
  pressed: { opacity: 0.8 },
  image: { width: "100%", aspectRatio: 0.8 },
  caption: { fontFamily: fonts.bold, fontSize: 12, paddingHorizontal: 6, paddingTop: 6, color: colors.ink },
  date: { fontFamily: fonts.semibold, fontSize: 11, paddingHorizontal: 6, paddingBottom: 6, color: colors.muted },
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(11,31,58,0.88)",
    justifyContent: "center",
    padding: space.xl,
    gap: space.md,
  },
  hero: { width: "100%", aspectRatio: 0.8, borderRadius: radius.card, backgroundColor: colors.cream },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.white, textAlign: "center" },
  heroDate: { fontFamily: fonts.semibold, fontSize: 13, color: colors.iceSoft, textAlign: "center" },
});
