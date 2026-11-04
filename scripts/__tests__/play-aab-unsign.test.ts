/**
 * D-16: the Play bundle is built UNSIGNED (the owner signs it with the upload
 * key afterwards). The Expo template signs the `release` build type with the
 * template debug keystore; the patch removes exactly that one line and leaves
 * the `debug` build type alone.
 */
import { describe, expect, test } from "bun:test";

import { unsignReleaseBuildType } from "../play-aab-unsign";

// Excerpt of node_modules/expo/template.tgz → android/app/build.gradle (SDK 57).
const TEMPLATE = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
        }
    }
`;

describe("unsignReleaseBuildType", () => {
  test("removes the debug signing from the release build type only", () => {
    const out = unsignReleaseBuildType(TEMPLATE);
    const release = out.slice(out.indexOf("        release {"));
    expect(release).not.toContain("signingConfig signingConfigs.debug");
    expect(release).toContain("shrinkResources enableShrinkResources.toBoolean()");
    // The debug build type and the debug keystore definition are untouched.
    expect(out.split("signingConfig signingConfigs.debug").length).toBe(2);
    expect(out).toContain("storeFile file('debug.keystore')");
  });

  test("is idempotent-safe: a second run refuses instead of guessing", () => {
    const once = unsignReleaseBuildType(TEMPLATE);
    expect(() => unsignReleaseBuildType(once)).toThrow(/release build type/);
  });

  test("refuses a file without a release build type", () => {
    expect(() => unsignReleaseBuildType("buildTypes {\n  debug {\n  }\n}\n")).toThrow(/release build type/);
  });

  test("refuses a release block that signs with anything else (never silently ships another key)", () => {
    const other = TEMPLATE.replace(
      "            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.debug",
      "            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.upload"
    );
    expect(() => unsignReleaseBuildType(other)).toThrow(/release build type/);
  });
});
