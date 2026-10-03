// MapLibre Native is not in Expo Go. Detect that before importing the native module.
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

export function isExpoGo() {
  return isRunningInExpoGo();
}

// iOS and Android development (or store) builds have MapLibre compiled in.
export function canUseNativeMapLibre() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  return !isExpoGo();
}

export function gardenMapAvailable(state) {
  return canUseNativeMapLibre() && state.mapRenderer === "garden";
}
