// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Catch names used without an import (a missing StyleSheet import crashed the map).
    // StyleSheet is also a browser global, which hid that missing import; remove it.
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { globals: { StyleSheet: "off" } },
    rules: { "no-undef": "error" },
  },
]);
