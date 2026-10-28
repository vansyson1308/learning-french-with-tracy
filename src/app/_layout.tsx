import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useSyncExternalStore } from "react";
import { ReduceMotion, ReducedMotionConfig } from "react-native-reanimated";

import { isCourseLoaded, loadCourse, onCourseLoaded } from "@/lib/course-bundle";
import { useProgress } from "@/lib/store";
import { useResolvedScheme, useThemeColors } from "@/lib/theme";

// Hold the splash until the persisted store has rehydrated — otherwise the
// first frames render default state and returning users see an onboarding
// flash on every cold start.
SplashScreen.preventAutoHideAsync().catch(() => {});

function subscribeToHydration(callback: () => void) {
  const unsubscribeHydration = useProgress.persist.onFinishHydration(callback);
  const unsubscribeStore = useProgress.subscribe(callback);
  return () => {
    unsubscribeHydration();
    unsubscribeStore();
  };
}
// Hydrated = the blob is back AND the learner store (cards, review log)
// has loaded the active course — the first frames never show an empty
// review queue to a returning learner (P1d).
function getHydrated() {
  return useProgress.persist.hasHydrated() && useProgress.getState().learnerReady;
}
function getServerHydrated() {
  return false;
}

// P3g: course content is loaded on demand — no screen renders before the
// active course's bundle is in memory (getPack / artifactsFor read it).
function subscribeToCourse(callback: () => void) {
  const off = onCourseLoaded(callback);
  const unsubscribeStore = useProgress.subscribe(callback);
  return () => {
    off();
    unsubscribeStore();
  };
}
function getActiveCourseLoaded() {
  return isCourseLoaded(useProgress.getState().activeCourseId);
}

export default function RootLayout() {
  const onboardingDone = useProgress((s) => s.onboardingDone);
  const segments = useSegments();
  const scheme = useResolvedScheme();
  const colors = useThemeColors();
  const storeHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated
  );
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const courseLoaded = useSyncExternalStore(subscribeToCourse, getActiveCourseLoaded, getServerHydrated);
  const hydrated = storeHydrated && courseLoaded;

  useEffect(() => {
    if (!storeHydrated) return;
    loadCourse(activeCourseId).catch((e: unknown) => {
      console.error(`course bundle ${activeCourseId} failed to load`, e);
    });
  }, [storeHydrated, activeCourseId]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  useEffect(() => {
    // Root window color, so transitions and overscroll never flash white.
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = segments[0] === "onboarding";
    const state = useProgress.getState();
    const hasProgress = Object.values(state.courses).some(
      (c) => c.xp > 0 || Object.keys(c.completedLessons).length > 0
    );
    const shouldShowOnboarding = !onboardingDone && !hasProgress;

    if (shouldShowOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (!shouldShowOnboarding && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [hydrated, onboardingDone, segments]);

  // The splash stays up until the store and the active course are ready.
  if (!hydrated) return null;

  return (
    <>
      {/* Honour the OS "Reduce Motion" setting (V1 accessibility): every
          reanimated transition — progress springs, entering fades, the
          path's bobbing start bubble — jumps to its end state instead of
          animating when the person has asked for less motion. */}
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="courses" options={{ presentation: "modal" }} />
        <Stack.Screen name="lesson/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="session/today" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="session/story" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="stories" />
        <Stack.Screen name="story/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="checkpoint/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="placement/intro" options={{ presentation: "modal" }} />
        <Stack.Screen name="placement/run" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="guidebook/[unitId]" options={{ presentation: "modal" }} />
        <Stack.Screen name="vocabulary/index" />
        <Stack.Screen name="vocabulary/[id]" />
        <Stack.Screen name="licenses" options={{ presentation: "modal" }} />
        <Stack.Screen name="privacy" options={{ presentation: "modal" }} />
        <Stack.Screen name="goals" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
