import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useSyncExternalStore } from "react";

import { useProgress } from "@/lib/store";
import { useResolvedScheme, useThemeColors } from "@/lib/theme";

// Hold the splash until the persisted store has rehydrated — otherwise the
// first frames render default state and returning users see an onboarding
// flash on every cold start.
SplashScreen.preventAutoHideAsync().catch(() => {});

function subscribeToHydration(callback: () => void) {
  return useProgress.persist.onFinishHydration(callback);
}
function getHydrated() {
  return useProgress.persist.hasHydrated();
}
function getServerHydrated() {
  return false;
}

export default function RootLayout() {
  const onboardingDone = useProgress((s) => s.onboardingDone);
  const segments = useSegments();
  const scheme = useResolvedScheme();
  const colors = useThemeColors();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated
  );

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

  return (
    <>
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
        <Stack.Screen name="checkpoint/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="placement/intro" options={{ presentation: "modal" }} />
        <Stack.Screen name="placement/run" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="guidebook/[unitId]" options={{ presentation: "modal" }} />
        <Stack.Screen name="vocabulary/index" />
        <Stack.Screen name="vocabulary/[id]" />
        <Stack.Screen name="licenses" options={{ presentation: "modal" }} />
        <Stack.Screen name="goals" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
