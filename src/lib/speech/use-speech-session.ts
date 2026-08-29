/**
 * Session-scoped speech resources (P8 §7/§8): ONE recognizer adapter per
 * session screen, created only when the session actually contains speak
 * steps, disposed on exit with a full speech-cache sweep (§8 boundary).
 * Capability is probed once up front (permission STATUS reads only — the
 * REQUEST happens at point of use, §24) and refreshed after requests.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { ExpoSpeechRecognizerAdapter } from "./expo-adapter";
import type { SpeechRecognizerPort } from "./recognizer-port";
import { sweepSpeechCache } from "./speech-cache";
import { unavailableCapability, type SpeechCapability } from "./types";

export type SpeechSessionApi = {
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

/**
 * One-shot capability probe for pre-session gates (P8 §20/§22): the
 * Section-4 checkpoint and the placement production stage decide up front
 * whether scored speech is even administrable. Creates a throwaway
 * adapter, probes, disposes — no permission REQUEST ever happens here.
 */
export async function probeSpeechCapabilityOnce(): Promise<SpeechCapability> {
  const adapter = new ExpoSpeechRecognizerAdapter();
  try {
    return await adapter.probeCapabilities();
  } catch {
    return unavailableCapability("unknown");
  } finally {
    adapter.dispose();
  }
}

/**
 * One-shot POINT-OF-USE permission request for pre-session gates (P9 §8):
 * starting a spoken checkpoint IS the point of use, so the preflight may
 * request here — the learner never discovers mid-checkpoint that every item
 * is unusable. Returns the refreshed capability snapshot.
 */
export async function requestSpeechPermissionOnce(): Promise<SpeechCapability> {
  const adapter = new ExpoSpeechRecognizerAdapter();
  try {
    return await adapter.requestPermissions();
  } catch {
    return unavailableCapability("unknown");
  } finally {
    adapter.dispose();
  }
}

export function useSpeechSession(enabled: boolean): SpeechSessionApi {
  const [port, setPort] = useState<SpeechRecognizerPort | null>(null);
  const [capability, setCapability] = useState<SpeechCapability | null>(null);
  const portRef = useRef<SpeechRecognizerPort | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const adapter = new ExpoSpeechRecognizerAdapter();
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
        setCapability(unavailableCapability("unknown"));
      });
    return () => {
      adapter.dispose();
      portRef.current = null;
      // §8: nothing recorded in this session survives leaving it.
      sweepSpeechCache();
    };
  }, [enabled]);

  const refresh = useCallback(async () => {
    const active = portRef.current;
    if (!active) return;
    try {
      setCapability(await active.probeCapabilities());
    } catch {
      setCapability(unavailableCapability("unknown"));
    }
  }, []);

  const request = useCallback(async () => {
    const active = portRef.current;
    if (!active) return;
    try {
      setCapability(await active.requestPermissions());
    } catch {
      setCapability(unavailableCapability("unknown"));
    }
  }, []);

  return { port, capability, request, refresh };
}
