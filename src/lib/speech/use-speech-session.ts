/**
 * Session-scoped speech resources (P8 §7/§8, per locale since P1b): ONE
 * recognizer adapter per session screen, created only when the session
 * actually contains speak steps, disposed on exit with a full speech-cache
 * sweep (§8 boundary). Capability is probed once up front for the course's
 * recognition locale (permission STATUS reads only — the REQUEST happens at
 * point of use, §24) and refreshed after requests.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { ExpoSpeechRecognizerAdapter } from "./expo-adapter";
import type { SpeechRecognizerPort } from "./recognizer-port";
import { sweepSpeechCache } from "./speech-cache";
import { unavailableCapability, type SpeechCapability } from "./types";

export type SpeechSessionApi = {
  /** The recognition locale every attempt of this session uses (course profile). */
  locale: string;
  /** Null until the session-level adapter is mounted (or when disabled). */
  port: SpeechRecognizerPort | null;
  capability: SpeechCapability | null;
  /** Point-of-use permission request (§24); refreshes the snapshot. */
  request: () => Promise<void>;
  refresh: () => Promise<void>;
};

/** Context the session screen hands to speak-step renderers. */
export type SpeechExerciseContext = {
  scored: boolean;
  session: SpeechSessionApi;
  /** "Can't speak now" — resolves the step with no evidence of any kind. */
  onSpeechSkip?: () => void;
};

/** In-flight one-shot probes, keyed by recognition locale (P1b): concurrent callers share one probe. */
const probeInFlight = new Map<string, Promise<SpeechCapability>>();

/**
 * One-shot capability probe for pre-session gates (P8 §20/§22): the
 * speaking checkpoint and the placement production stage decide up front
 * whether scored speech is even administrable. Creates a throwaway
 * adapter, probes, disposes — no permission REQUEST ever happens here.
 * Memoised per locale WHILE IN FLIGHT (screens mounting together share one
 * probe); results are never cached across time, because permissions and
 * installed language packs change under the app.
 */
export function probeSpeechCapabilityOnce(locale: string): Promise<SpeechCapability> {
  const hit = probeInFlight.get(locale);
  if (hit) return hit;
  const adapter = new ExpoSpeechRecognizerAdapter(locale);
  const pending = adapter
    .probeCapabilities()
    .catch(() => unavailableCapability("unknown", "none", locale))
    .finally(() => {
      adapter.dispose();
      probeInFlight.delete(locale);
    });
  probeInFlight.set(locale, pending);
  return pending;
}

/**
 * One-shot POINT-OF-USE permission request for pre-session gates (P9 §8):
 * starting a spoken checkpoint IS the point of use, so the preflight may
 * request here — the learner never discovers mid-checkpoint that every item
 * is unusable. Returns the refreshed capability snapshot.
 */
export async function requestSpeechPermissionOnce(locale: string): Promise<SpeechCapability> {
  const adapter = new ExpoSpeechRecognizerAdapter(locale);
  try {
    return await adapter.requestPermissions();
  } catch {
    return unavailableCapability("unknown", "none", locale);
  } finally {
    adapter.dispose();
  }
}

export function useSpeechSession(enabled: boolean, locale: string): SpeechSessionApi {
  const [port, setPort] = useState<SpeechRecognizerPort | null>(null);
  const [capability, setCapability] = useState<SpeechCapability | null>(null);
  const portRef = useRef<SpeechRecognizerPort | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const adapter = new ExpoSpeechRecognizerAdapter(locale);
    portRef.current = adapter;
    // Port and capability land together after the async probe (the UI shows
    // its "checking…" state until then; no synchronous effect setState).
    adapter
      .probeCapabilities()
      .then((snapshot) => {
        if (portRef.current !== adapter) return; // unmounted meanwhile
        setPort(adapter);
        setCapability(snapshot);
      })
      .catch(() => {
        if (portRef.current !== adapter) return;
        setPort(adapter);
        setCapability(unavailableCapability("unknown", "none", locale));
      });
    return () => {
      adapter.dispose();
      portRef.current = null;
      // §8: nothing recorded in this session survives leaving it.
      sweepSpeechCache();
    };
  }, [enabled, locale]);

  const refresh = useCallback(async () => {
    const active = portRef.current;
    if (!active) return;
    try {
      setCapability(await active.probeCapabilities());
    } catch {
      setCapability(unavailableCapability("unknown", "none", locale));
    }
  }, [locale]);

  const request = useCallback(async () => {
    const active = portRef.current;
    if (!active) return;
    try {
      setCapability(await active.requestPermissions());
    } catch {
      setCapability(unavailableCapability("unknown", "none", locale));
    }
  }, [locale]);

  return { locale, port, capability, request, refresh };
}
