/**
 * One listening step's audio (P7 §17-26 + QC 2026-11-05 §2.1): the bundled
 * clip when there is one; else, for a device-voice course, the installed
 * local device voice reading the clip's transcript; else nothing (the
 * renderer offers the skip). Both players are always created (hooks run
 * unconditionally); only the one the plan names is shown. A course that does
 * not opt in never looks for a voice and never reaches expo-speech here.
 * P4e session 3: the speech exercises' model clips use the same plan (unscored).
 */

import { useMemo } from "react";

import { courseProfile } from "../course-profile";
import { useDeviceVoice } from "../stories/use-device-read-along";

import { clipAudioSource, clipFor } from "./content";
import { deviceUtterances, deviceVoiceListeningCourse, listeningAudioPlan, type ListeningAudioPlan } from "./device-voice-listening";
import type { ListeningPlayerConfig } from "./listening-player";
import { useDeviceListeningPlayer } from "./use-device-listening-player";
import { useListeningPlayer, type ListeningPlayerApi } from "./use-listening-player";

export function useListeningAudio(
  courseId: string,
  /** null: no clip (a speech item without a model); the plan is then "unavailable". */
  clipId: string | null,
  config: ListeningPlayerConfig
): { plan: ListeningAudioPlan; api: ListeningPlayerApi } {
  const bundled = clipId === null ? null : clipAudioSource(courseId, clipId);
  const clip = clipId === null ? undefined : clipFor(courseId, clipId);
  const deviceCourse = deviceVoiceListeningCourse(courseId);
  const wantsVoice = deviceCourse && bundled === null && clip !== undefined;
  const voice = useDeviceVoice(courseProfile(courseId).ttsLocale, wantsVoice);
  const utterances = useMemo(() => (wantsVoice && clip ? deviceUtterances(clip.transcriptLines) : []), [wantsVoice, clip]);
  const bundledApi = useListeningPlayer(bundled, config);
  const deviceApi = useDeviceListeningPlayer(utterances, wantsVoice ? (voice ?? null) : null, config);
  const plan = listeningAudioPlan({
    bundled,
    deviceVoiceCourse: deviceCourse,
    lines: clip?.transcriptLines ?? null,
    voice: wantsVoice ? voice : null,
    voiceFailed: deviceApi.voiceFailed,
  });
  const onDevice = plan.kind === "device-voice" || plan.kind === "looking-for-voice";
  return { plan, api: onDevice ? deviceApi : bundledApi };
}
