// three >= 0.186's CommonJS entry (which React Three Fiber loads) calls Node's
// process.emitWarning to say CommonJS is deprecated. React Native has no
// process.emitWarning, so it crashes with "undefined is not a function".
// Import this before anything that loads three.
import { LogBox } from "react-native";

globalThis.process = globalThis.process ?? {};
if (typeof globalThis.process.emitWarning !== "function") {
  globalThis.process.emitWarning = () => {};
}

// When a 3D screen closes, React Three Fiber calls forceContextLoss(), which
// needs the WEBGL_lose_context extension. expo-gl (Android especially) doesn't
// have it, so three warns. Harmless: the GL view is torn down anyway.
LogBox.ignoreLogs(["WEBGL_lose_context extension not supported"]);
