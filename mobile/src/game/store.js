// Tiny state store. Game actions read the latest state synchronously with
// getState() (needed for async flows like expeditions and walks), and React
// components subscribe with useStore().
import { useSyncExternalStore } from "react";

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.getState);
}
