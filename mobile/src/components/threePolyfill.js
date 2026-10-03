// three >= 0.186's CommonJS entry (which React Three Fiber loads) calls Node's
// process.emitWarning to say CommonJS is deprecated. React Native has no
// process.emitWarning, so it crashes with "undefined is not a function".
// Import this before anything that loads three.
globalThis.process = globalThis.process ?? {};
if (typeof globalThis.process.emitWarning !== "function") {
  globalThis.process.emitWarning = () => {};
}
