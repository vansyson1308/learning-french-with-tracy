/**
 * Permission minimization and privacy-manifest configuration (Phase 10
 * §45, §47, §74). These pin the app config that `expo prebuild` turns into
 * the Android manifest and the iOS Info.plist / PrivacyInfo.xcprivacy —
 * the generated projects were inspected once by hand; this keeps the
 * config from drifting back.
 */
import { describe, expect, test } from "bun:test";

import { readFileSync } from "fs";

type AppJson = {
  expo: {
    android: { permissions: string[]; blockedPermissions: string[]; predictiveBackGestureEnabled: boolean };
    ios: {
      infoPlist: Record<string, unknown>;
      privacyManifests: {
        NSPrivacyTracking: boolean;
        NSPrivacyTrackingDomains: string[];
        NSPrivacyCollectedDataTypes: unknown[];
        NSPrivacyAccessedAPITypes: { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] }[];
      };
    };
    plugins: (string | [string, Record<string, unknown>])[];
  };
};

const app = (JSON.parse(readFileSync("app.json", "utf8")) as AppJson).expo;
const plugin = (name: string) => {
  const entry = app.plugins.find((p) => (Array.isArray(p) ? p[0] : p) === name);
  return Array.isArray(entry) ? entry[1] : entry ? {} : undefined;
};

describe("Android permissions are the minimum the product uses", () => {
  test("only the microphone (speech recognition) and audio-mode permissions are requested", () => {
    expect([...app.android.permissions].sort()).toEqual([
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.RECORD_AUDIO",
    ]);
  });

  test("no foreground service: the app never plays or records in the background", () => {
    for (const p of app.android.permissions) expect(p).not.toMatch(/FOREGROUND_SERVICE|POST_NOTIFICATIONS/);
    expect(plugin("expo-audio")).toEqual({ enableBackgroundPlayback: false, recordAudioAndroid: false });
  });

  test("template and library defaults the product does not need are blocked", () => {
    // SYSTEM_ALERT_WINDOW / *_EXTERNAL_STORAGE: template defaults (Phase 10).
    // ACCESS_NETWORK_STATE (expo-image, media3) and WAKE_LOCK (media3-exoplayer
    // via expo-audio): merged in from library manifests — seen on the RC3
    // local build (P0); the app makes no requests and never plays in the
    // background, so the merged APK must carry exactly the four permissions
    // the privacy policy and DATA_SAFETY.md declare.
    expect([...app.android.blockedPermissions].sort()).toEqual([
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WAKE_LOCK",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ]);
  });

  test("the speech-recognition plugin carries honest, situation-specific usage strings", () => {
    const speech = plugin("expo-speech-recognition") as Record<string, string>;
    expect(speech.microphonePermission).toMatch(/only while you practice speaking/i);
    // P1b: language-neutral — no course's language is named in a permission string.
    expect(speech.microphonePermission).not.toMatch(/french/i);
    expect(speech.speechRecognitionPermission).not.toMatch(/french/i);
    expect(speech.speechRecognitionPermission).toMatch(/Nothing is recorded until you tap the record button/);
  });
});

describe("iOS privacy manifest (app level)", () => {
  const manifest = app.ios.privacyManifests;

  test("declares no tracking, no tracking domains, and no collected data types", () => {
    expect(manifest.NSPrivacyTracking).toBe(false);
    expect(manifest.NSPrivacyTrackingDomains).toEqual([]);
    expect(manifest.NSPrivacyCollectedDataTypes).toEqual([]);
  });

  test("declares exactly the required-reason APIs the linked React Native / Expo code uses", () => {
    const declared = Object.fromEntries(
      manifest.NSPrivacyAccessedAPITypes.map((a) => [a.NSPrivacyAccessedAPIType, a.NSPrivacyAccessedAPITypeReasons])
    );
    expect(declared).toEqual({
      NSPrivacyAccessedAPICategoryFileTimestamp: ["C617.1"],
      NSPrivacyAccessedAPICategoryUserDefaults: ["CA92.1"],
      NSPrivacyAccessedAPICategorySystemBootTime: ["35F9.1"],
      NSPrivacyAccessedAPICategoryDiskSpace: ["E174.1"],
    });
  });

  test("encryption export compliance stays declared (no non-exempt encryption)", () => {
    expect(app.ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false);
  });
});
