// AR-style landmark capture: camera viewfinder with your agent in the frame,
// then a postcard preview that's saved as an image. Next step for true AR:
// ViroReact (needs a development build) to anchor the agent in 3D.
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import { creatureSvg } from "../core/art.js";
import { colors } from "../theme.js";
import { Button, Hint } from "./ui.js";

const CARD_PIXELS = Object.freeze({ width: 480, height: 600 }); // keeps saved cards small

export function CaptureModal({ visible, place, agent, level, onSave, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef(null);
  const cardRef = useRef(null);

  if (!place) return null;
  const creature = creatureSvg(agent, level);

  const close = () => {
    setPhoto(null);
    setError("");
    onClose();
  };

  const snap = async () => {
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      setPhoto(picture.uri);
    } catch (snapError) {
      console.warn("Camera capture failed:", snapError);
      setError("Couldn't take the picture. Try again, or use the landmark photo.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const image = await captureRef(cardRef, { format: "jpg", quality: 0.7, result: "data-uri", ...CARD_PIXELS });
      setPhoto(null);
      onSave(image);
    } catch (saveError) {
      console.warn("Saving postcard failed:", saveError);
      setError("Couldn't save the postcard. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const useLandmarkPhoto = () => (place.photo ? setPhoto(place.photo) : setError("This landmark has no photo."));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.screen}>
        <Text style={styles.heading} numberOfLines={1}>{`📸 ${place.title}`}</Text>

        {photo ? (
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <Image source={{ uri: photo }} style={styles.cardPhoto} />
            <View style={styles.cardCreature}>
              <SvgXml xml={creature} width={90} height={90} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{place.title}</Text>
            <Text style={styles.cardCaption}>{`Captured with ${agent.name} · ${new Date().toLocaleDateString()} · 🐾 HuskiesPaws`}</Text>
          </View>
        ) : permission?.granted ? (
          <View style={styles.viewfinder}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
            <View style={styles.frame} pointerEvents="none" />
            <View style={styles.creature} pointerEvents="none">
              <SvgXml xml={creature} width={96} height={96} />
            </View>
          </View>
        ) : (
          <View style={[styles.viewfinder, styles.center]}>
            <Text style={styles.light}>Camera access is needed to capture landmarks.</Text>
            <Button title="Allow camera" onPress={requestPermission} style={styles.gap} />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : (
          <Hint style={styles.hintDark}>{photo ? "Looks good? Save it to your album." : "Line up the landmark in the frame, then capture."}</Hint>
        )}

        <View style={styles.actions}>
          {photo ? (
            <>
              <Button title="Save to album" onPress={save} disabled={busy} />
              <Button title="Retake" variant="secondary" onPress={() => setPhoto(null)} disabled={busy} />
            </>
          ) : (
            <>
              <Button title="📸 Capture" onPress={snap} disabled={busy || !permission?.granted} />
              <Button title="Use landmark photo" variant="secondary" onPress={useLandmarkPhoto} disabled={busy} />
            </>
          )}
          <Button title="Cancel" variant="secondary" onPress={close} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111", paddingTop: 56, paddingHorizontal: 16, gap: 12 },
  heading: { color: "#fff", fontSize: 18, fontWeight: "700" },
  viewfinder: { width: "100%", aspectRatio: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#333" },
  center: { alignItems: "center", justifyContent: "center", padding: 16 },
  light: { color: "#ddd", textAlign: "center" },
  gap: { marginTop: 12 },
  frame: { position: "absolute", top: "15%", left: "15%", right: "15%", bottom: "15%", borderWidth: 3, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.7)", borderRadius: 16 },
  creature: { position: "absolute", left: 10, bottom: 6 },
  card: { width: "100%", aspectRatio: 0.8, backgroundColor: "#fffdf6", padding: 12, borderRadius: 4 },
  cardPhoto: { width: "100%", flex: 1, backgroundColor: "#bde0fe" },
  cardCreature: { position: "absolute", left: 18, bottom: 70 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 8 },
  cardCaption: { fontSize: 11, color: colors.muted },
  hintDark: { color: "#bbb" },
  error: { color: "#ff8a80" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
