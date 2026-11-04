/**
 * The model clip of a speech exercise (P8 §11): the bundled clip when there is one; for a device-voice course
 * (coordinator 2026-11-05, P4e session 3) the installed local voice reading the clip's transcript, or — with no such
 * voice — the "no device voice" notice with the install hint. A model is support, never graded, so the notice offers
 * no skip: the target text and the microphone stay.
 */
import React from "react";
import { View } from "react-native";

import { DeviceVoiceLabel, DeviceVoiceMissing } from "@/components/session/device-voice-missing";
import { ListeningPlayerView } from "@/components/session/listening-player-view";
import type { ListeningAudioPlan } from "@/lib/reception/device-voice-listening";
import type { ListeningPlayerApi } from "@/lib/reception/use-listening-player";

export function ModelPlayback({ courseId, plan, api }: { courseId: string; plan: ListeningAudioPlan; api: ListeningPlayerApi }) {
  if (plan.kind === "no-device-voice") return <DeviceVoiceMissing courseId={courseId} />;
  return (
    <View style={{ gap: 6 }}>
      <ListeningPlayerView api={api} />
      {plan.kind === "device-voice" ? <DeviceVoiceLabel /> : null}
    </View>
  );
}
