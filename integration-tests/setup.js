/* Jest-side native mocks for the integration suite. */
/* eslint-disable no-undef */
// Reanimated is replaced at RESOLUTION level (moduleNameMapper in
// jest.config.js): both its runtime and its official mock need the worklets
// native runtime, which Jest doesn't have. Do NOT also jest.mock it here —
// the two mechanisms recurse.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({ seekTo: jest.fn(), play: jest.fn(), replace: jest.fn() }),
  createAudioPlayer: () => ({ seekTo: jest.fn(), play: jest.fn(), replace: jest.fn(), remove: jest.fn() }),
  setAudioModeAsync: async () => {},
}));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));
