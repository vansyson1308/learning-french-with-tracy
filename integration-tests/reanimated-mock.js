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
const { View, Text, Image, ScrollView } = require("react-native");

const id = (v) => v;
const chainable = () => {
  const self = {};
  for (const k of ["duration", "delay", "springify", "damping", "stiffness"]) {
    self[k] = () => self;
  }
  return self;
};

const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref })
);
AnimatedView.displayName = "Animated.View";
const AnimatedText = React.forwardRef((props, ref) =>
  React.createElement(Text, { ...props, ref })
);
AnimatedText.displayName = "Animated.Text";

module.exports = {
  __esModule: true,
  default: {
    View: AnimatedView,
    Text: AnimatedText,
    Image,
    ScrollView,
    createAnimatedComponent: (C) => C,
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
