// Saved progress on the phone (AsyncStorage). Mirrors prototype/js/storage.js,
// but async: load everything once at startup, then save in batches.
import AsyncStorage from "@react-native-async-storage/async-storage";

// Kept from the app's earlier name so existing saved progress isn't lost.
const PREFIX = "wanderlings:";
let writes = Promise.resolve();
const enqueue = (run) => {
  const next = writes.then(run);
  writes = next.catch(() => {});
  return next;
};

export async function loadAll(defaults) {
  const keys = Object.keys(defaults);
  try {
    const pairs = await AsyncStorage.multiGet(keys.map((key) => PREFIX + key));
    return Object.fromEntries(
      pairs.map(([, raw], i) => [keys[i], raw ? JSON.parse(raw) : defaults[keys[i]]]),
    );
  } catch (error) {
    console.warn("Could not load saved progress, using defaults:", error);
    return defaults;
  }
}

export function saveAll(values) {
  const entries = Object.entries(values).map(([key, value]) => [PREFIX + key, JSON.stringify(value)]);
  return enqueue(async () => {
    try {
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      console.warn("Could not save progress:", error);
    }
  });
}

export function clearKeys(keys) {
  return enqueue(async () => {
    try {
      await AsyncStorage.multiRemove(keys.map((key) => PREFIX + key));
    } catch (error) {
      console.warn("Could not clear saved progress:", error);
    }
  });
}
