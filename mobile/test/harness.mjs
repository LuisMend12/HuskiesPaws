// Load the real game modules in an isolated JS realm with native adapters mocked.
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const flush = async () => { for (let i = 0; i < 60; i += 1) await Promise.resolve(); };
export const deferred = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
};

export async function runtime({ api = "", fetchImpl = async () => Response.json({}), saved = {} } = {}) {
  const intervals = new Map();
  const timeouts = new Map();
  const data = new Map(Object.entries(saved).map(([k, v]) => [`wanderlings:${k}`, JSON.stringify(v)]));
  const speech = [];
  const audio = [];
  let id = 0;
  const context = createContext({
    console, URL, URLSearchParams, AbortController, AbortSignal, Uint8Array,
    process: { env: { EXPO_PUBLIC_API_URL: api } }, fetch: fetchImpl,
    setInterval: (run, ms) => { const key = ++id; intervals.set(key, { run, ms }); return key; },
    clearInterval: (key) => intervals.delete(key),
    setTimeout: (run, ms) => { const key = ++id; timeouts.set(key, { run, ms }); return key; },
    clearTimeout: (key) => timeouts.delete(key),
  });
  const storage = {
    async multiGet(keys) { return keys.map((key) => [key, data.get(key) ?? null]); },
    async multiSet(pairs) { for (const [key, value] of pairs) data.set(key, value); },
    async multiRemove(keys) { for (const key of keys) data.delete(key); },
  };
  const mocks = {
    react: { useSyncExternalStore() {} },
    "@react-native-async-storage/async-storage": { default: storage },
    "expo-speech": { stop() {}, speak(text) { speech.push(text); } },
    "expo-audio": {
      async setAudioModeAsync() {},
      createAudioPlayer(uri) {
        const player = { uri, play() { audio.push(uri); }, remove() {}, addListener() { return { remove() {} }; } };
        return player;
      },
    },
    "expo-file-system": {
      Paths: { cache: "file:///cache" },
      File: class { constructor(base, name) { this.uri = `${base}/${name}`; } create() { this.exists = true; } write() {} delete() { this.exists = false; } },
    },
    "expo-location": { Accuracy: { High: 1 }, async requestForegroundPermissionsAsync() { return { granted: false }; } },
    "expo-sensors": { Pedometer: { async isAvailableAsync() { return false; } } },
  };
  const cache = new Map();
  async function createModule(path) {
    const mock = mocks[path];
    let module;
    if (mock) {
      module = new SyntheticModule(Object.keys(mock), function () {
        for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
      }, { context, identifier: path });
    } else {
      module = new SourceTextModule(await readFile(path, "utf8"), { context, identifier: path });
    }
    return module;
  }
  function load(path) {
    if (!cache.has(path)) cache.set(path, createModule(path));
    return cache.get(path);
  }
  const linker = (specifier, parent) => load(specifier.startsWith(".") ? resolve(dirname(parent.identifier), specifier) : specifier);
  const gameModule = await load(resolve(root, "src/game/game.js"));
  await gameModule.link(linker);
  await gameModule.evaluate();
  const game = gameModule.namespace.createGame();
  await game.load();
  await flush();
  return {
    game, data, intervals, timeouts, speech, audio,
    async module(relative) {
      const mod = await load(resolve(root, relative));
      if (mod.status === "unlinked") await mod.link(linker);
      await mod.evaluate();
      return mod.namespace;
    },
  };
}
