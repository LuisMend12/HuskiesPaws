// MapLibre Native is not in Expo Go. Detect that before importing the native module.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export function isExpoGo() {
  return Constants.appOwnership === "expo";
}

// StoreClient covers Expo Go *and* expo-dev-client, so appOwnership is the Go check.
export function canUseNativeMapLibre() {
  if (Platform.OS !== "ios") return false;
  if (isExpoGo()) return false;
  const env = Constants.executionEnvironment;
  return env === ExecutionEnvironment.Bare || env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.StoreClient;
}

export function gardenMapAvailable(state) {
  return canUseNativeMapLibre() && state.mapRenderer === "garden";
}
