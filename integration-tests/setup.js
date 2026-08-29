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
  useAudioPlayer: () => ({
    seekTo: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    setPlaybackRate: jest.fn(),
  }),
  // Static status: the pure listening-player machine is fully covered by
  // unit tests; here the adapter only needs a stable non-playing status.
  useAudioPlayerStatus: () => ({
    playing: false,
    didJustFinish: false,
    currentTime: 0,
    duration: 1.2,
    isLoaded: true,
  }),
  createAudioPlayer: () => ({ seekTo: jest.fn(), play: jest.fn(), replace: jest.fn(), remove: jest.fn() }),
  setAudioModeAsync: async () => {},
}));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));
// Speech recognition (P8): a controllable double of the provider module.
// Default shape = a capable iOS device with permissions granted; tests
// mutate `__speechState` and drive events through `__emitSpeechEvent`.
jest.mock("expo-speech-recognition", () => {
  const listeners = new Map();
  const state = {
    available: true,
    onDevice: true,
    recording: true,
    locales: ["fr-FR"],
    installedLocales: ["fr-FR"],
    permission: { granted: true, status: "granted", canAskAgain: true },
    startCalls: [],
  };
  const ExpoSpeechRecognitionModule = {
    addListener(name, handler) {
      const list = listeners.get(name) ?? [];
      list.push(handler);
      listeners.set(name, list);
      return {
        remove() {
          listeners.set(name, (listeners.get(name) ?? []).filter((h) => h !== handler));
        },
      };
    },
    start(options) {
      state.startCalls.push(options);
    },
    stop: jest.fn(),
    abort: jest.fn(),
    isRecognitionAvailable: () => state.available,
    supportsOnDeviceRecognition: () => state.onDevice,
    supportsRecording: () => state.recording,
    getSupportedLocales: async () => ({
      locales: state.locales,
      installedLocales: state.installedLocales,
    }),
    getMicrophonePermissionsAsync: async () => state.permission,
    getSpeechRecognizerPermissionsAsync: async () => state.permission,
    requestPermissionsAsync: async () => state.permission,
  };
  return {
    ExpoSpeechRecognitionModule,
    __speechState: state,
    __emitSpeechEvent: (name, payload) => {
      for (const handler of [...(listeners.get(name) ?? [])]) handler(payload);
    },
  };
});
jest.mock("expo-haptics", () => ({
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));
