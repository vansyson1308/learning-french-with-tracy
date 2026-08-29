/**
 * Alias for the reanimated jest mock. The implementation lives in
 * reanimated-mock-impl.js; this wrapper exists because BOTH specifiers
 * ("react-native-reanimated" and "react-native-reanimated/mock") must be
 * mapped, but to DIFFERENT resolved paths: expo-router/testing-library
 * registers jest.mock on the main specifier's resolved file and its factory
 * requires the /mock subpath — if both resolved to one file, that require
 * would re-enter the registered factory and Jest's circularity guard would
 * silently return {}.
 */
module.exports = require("./reanimated-mock-impl.js");
