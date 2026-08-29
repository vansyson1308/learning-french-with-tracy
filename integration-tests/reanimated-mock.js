/**
 * Minimal hand-rolled reanimated mock for the Jest integration suite.
 * The official react-native-reanimated/mock imports the real package, which
 * requires the worklets native runtime and throws under Jest — so we mock
 * exactly the surface this app uses (verified by grep): Animated.View/Text,
 * useSharedValue, useAnimatedStyle, withSpring/withTiming/withSequence/
 * withRepeat, and the entering animations with their chainable builders.
 */
/* eslint-disable no-undef */
const React = require("react");

// react-native is required LAZILY: expo-router/testing-library's own
// jest.mock factory for reanimated evaluates this file mid-import-chain,
// where an eager react-native require can throw and silently downgrade the
// whole module to {} (their factory catch). Deferring the require to first
// render keeps the factory safe.
const RN = () => require("react-native");

const id = (v) => v;
const chainable = () => {
  const self = {};
  for (const k of ["duration", "delay", "springify", "damping", "stiffness"]) {
    self[k] = () => self;
  }
  return self;
};

const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(RN().View, { ...props, ref })
);
AnimatedView.displayName = "Animated.View";
const AnimatedText = React.forwardRef((props, ref) =>
  React.createElement(RN().Text, { ...props, ref })
);
AnimatedText.displayName = "Animated.Text";
const AnimatedImage = React.forwardRef((props, ref) =>
  React.createElement(RN().Image, { ...props, ref })
);
AnimatedImage.displayName = "Animated.Image";
const AnimatedScrollView = React.forwardRef((props, ref) =>
  React.createElement(RN().ScrollView, { ...props, ref })
);
AnimatedScrollView.displayName = "Animated.ScrollView";

module.exports = {
  __esModule: true,
  default: {
    View: AnimatedView,
    Text: AnimatedText,
    Image: AnimatedImage,
    ScrollView: AnimatedScrollView,
    createAnimatedComponent: (C) => C,
    call: () => {},
  },
  useSharedValue: (init) => {
    const box = { value: init };
    box.get = () => box.value;
    box.set = (v) => {
      box.value = typeof v === "function" ? v(box.value) : v;
    };
    return box;
  },
  useAnimatedStyle: (factory) => {
    try {
      return factory();
    } catch {
      return {};
    }
  },
  withSpring: id,
  withTiming: id,
  withSequence: (...steps) => steps[steps.length - 1],
  withRepeat: id,
  FadeInDown: chainable(),
  FadeInUp: chainable(),
  ZoomIn: chainable(),
  Easing: new Proxy({}, { get: () => () => id }),
};
