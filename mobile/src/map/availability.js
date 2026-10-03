// MapLibre Native is not in Expo Go. Detect that before importing the native module.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export function isExpoGo() {
  // StoreClient is Expo Go *and* expo-dev-client; expoGoConfig / appOwnership mark Go.
  return Constants.appOwnership === "expo" || Boolean(Constants.expoGoConfig);
}

export function canUseNativeMapLibre() {
  if (Platform.OS !== "ios" || isExpoGo()) return false;
  const env = Constants.executionEnvironment;
  return env === ExecutionEnvironment.Bare || env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.StoreClient;
}

export function gardenMapAvailable(state) {
  return canUseNativeMapLibre() && state.mapRenderer === "garden";
}
