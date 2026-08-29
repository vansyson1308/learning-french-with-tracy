/**
 * Jest runs ONLY the React Native integration suite (integration-tests/).
 * The Bun suite (src/, scripts/) stays the authoritative fast pure-logic
 * runner — package.json's "test" script is scoped so the two never collide.
 */
module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/integration-tests"],
  setupFiles: ["<rootDir>/integration-tests/setup.js"],
  // These are full-router behavior tests (renderRouter over the real app
  // tree); on a contended CI runner with all suites in parallel, a single
  // render can exceed jest's 5s default. Assertions are unchanged — this is
  // capacity headroom, not tolerance.
  testTimeout: 30000,
  moduleNameMapper: {
    // Mirror tsconfig: @/assets/* lives at the repo root, @/* under src/.
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Resolution-level mock: reanimated 4 (and its official mock) require
    // the worklets native runtime, which Jest doesn't have. The /mock
    // subpath must be mapped too: expo-router/testing-library's jest.mock
    // factory requires it, and an unmapped (throwing) require silently
    // downgrades the whole module to {} for renderRouter suites.
    "^react-native-reanimated$": "<rootDir>/integration-tests/reanimated-mock.js",
    "^react-native-reanimated/mock$": "<rootDir>/integration-tests/reanimated-mock-impl.js",
  },
};
