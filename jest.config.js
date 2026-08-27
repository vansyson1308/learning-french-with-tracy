/**
 * Jest runs ONLY the React Native integration suite (integration-tests/).
 * The Bun suite (src/, scripts/) stays the authoritative fast pure-logic
 * runner — package.json's "test" script is scoped so the two never collide.
 */
module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/integration-tests"],
  setupFiles: ["<rootDir>/integration-tests/setup.js"],
  moduleNameMapper: {
    // Mirror tsconfig: @/assets/* lives at the repo root, @/* under src/.
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Resolution-level mock: reanimated 4 (and its official mock) require
    // the worklets native runtime, which Jest doesn't have.
    "^react-native-reanimated$": "<rootDir>/integration-tests/reanimated-mock.js",
  },
};
