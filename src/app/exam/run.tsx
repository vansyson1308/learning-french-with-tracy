/**
 * Exam-track runner (P3d). Three modes on the shared session architecture:
 *  - practice: one section, the whole bank, full feedback, untimed;
 *  - mock: every section of ONE parallel form in order, each on the
 *    format's clock (time up = unanswered items count as not answered),
 *    minimal feedback, one recorded attempt at the end;
 *  - weak: an FSRS-recorded vocabulary practice over the lexemes the
 *    latest exam attempt missed (the only path from exam results to FSRS).
 * Attempts are recorded by this route (completion "exam"); nothing here
 * touches CEFR objective states.
 */

import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DuoButton } from "@/components/duo-button";
import { ExamResults } from "@/components/exam/exam-results";
import { SessionScreen } from "@/components/session/session-screen";
import type { AssessmentItemResult } from "@/lib/assessment/types";
import { useCourseContent } from "@/lib/content";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { examTrackFor } from "@/lib/exam/content";
import {
  buildExamAttempt,
  buildExamSectionSession,
  examAttemptId,
  examWeakAreas,
  isExamAttemptOf,
  itemResultsFor,
  sectionItems,
  selectMockForm,
  type CompiledExamTrack,
  type ExamMode,
} from "@/lib/exam/engine";
import { useT } from "@/lib/i18n";
import { buildWeakAreaSessionDefinition } from "@/lib/session/sources";
import { networkDisclosureRequired, networkDisclosureText } from "@/lib/speech/step-policy";
import { probeSpeechCapabilityOnce, requestSpeechPermissionOnce } from "@/lib/speech/use-speech-session";
import { assessmentFor, useProgress } from "@/lib/store";
import { makeThemedStyles } from "@/lib/theme";

export default function ExamRunScreen() {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const { track: trackId, mode, section } = useLocalSearchParams<{ track: string; mode: string; section?: string }>();
  if (!hasCapability(activeCourseId, "exam")) return <Redirect href="/" />;
  const track = examTrackFor(activeCourseId, trackId ?? "");
  if (!track) return <Redirect href="/" />;
  if (mode === "weak") return <WeakAreaRun courseId={activeCourseId} track={track} />;
  if (mode === "practice" && section && track.sections.some((s) => s.id === section)) {
    return <PracticeRun courseId={activeCourseId} track={track} sectionId={section} />;
  }
  if (mode === "mock") return <MockRun courseId={activeCourseId} track={track} />;
  return <Redirect href="/" />;
}

function priorCount(courseId: string, checkpointId: string): number {
  return assessmentFor(useProgress.getState(), courseId).checkpointAttempts.filter((a) => a.checkpointId === checkpointId).length;
}

/** Records the attempt exactly once when mounted, then renders the results. */
function RecordAndShow({
  track,
  mode,
  sectionId,
  formId,
  itemResults,
  startedAt,
}: {
  track: CompiledExamTrack;
  mode: ExamMode;
  sectionId?: string;
  formId: string;
  itemResults: AssessmentItemResult[];
  startedAt: number;
}) {
  const record = useProgress((s) => s.recordCheckpointAttempt);
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    record(buildExamAttempt({ track, mode, sectionId, formId, itemResults, startedAt, completedAt: Date.now() }));
  }, [record, track, mode, sectionId, formId, itemResults, startedAt]);
  return (
    <ExamResults
      track={track}
      mode={mode}
      formId={formId}
      itemResults={itemResults}
      onPracticeWeak={() => router.replace({ pathname: "/exam/run", params: { track: track.id, mode: "weak" } })}
      onDone={() => router.back()}
    />
  );
}

// ---------------------------------------------------------------- speech gate

type SpeechGate = "probing" | "ok" | "needsPermission" | "unavailable";

function useSpeechGate(locale: string, needed: boolean) {
  const [gate, setGate] = useState<SpeechGate>(needed ? "probing" : "ok");
  const [disclosure, setDisclosure] = useState(false);
  const acknowledged = useProgress((s) => (s.speechNoticeAckAt ?? null) !== null);
  const fromCapability = (c: Awaited<ReturnType<typeof probeSpeechCapabilityOnce>>): SpeechGate => {
    if (!c.available || !c.targetRecognitionAvailable || c.platform === "web") return "unavailable";
    if (c.microphonePermission === "granted" && c.speechPermission === "granted") return "ok";
    if (c.microphonePermission === "undetermined" || c.speechPermission === "undetermined") return "needsPermission";
    return "unavailable";
  };
  useEffect(() => {
    if (!needed) return;
    let live = true;
    void probeSpeechCapabilityOnce(locale).then((c) => {
      if (!live) return;
      setDisclosure(networkDisclosureRequired(c, acknowledged));
      setGate(fromCapability(c));
    });
    return () => {
      live = false;
    };
    // probed once per mount on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needed]);
  const request = () => void requestSpeechPermissionOnce(locale).then((c) => setGate(fromCapability(c)));
  return { gate, disclosure, clearDisclosure: () => setDisclosure(false), request };
}

function SpeechGateView({
  gate,
  disclosure,
  targetLanguage,
  onRequest,
  onAcknowledge,
  onSkip,
}: {
  gate: SpeechGate;
  disclosure: boolean;
  targetLanguage: string;
  onRequest: () => void;
  onAcknowledge: () => void;
  onSkip: () => void;
}) {
  const styles = useStyles();
  const { t, tm } = useT();
  return (
    <View style={styles.center}>
      {gate === "probing" ? (
        <Text style={styles.title}>{t("checkpoint.probing")}</Text>
      ) : gate === "unavailable" ? (
        <>
          <Text style={styles.title}>{t("checkpoint.blockedTitle")}</Text>
          <Text style={styles.body} testID="exam-speech-unavailable">
            {t("exam.speaking.unavailable", { language: targetLanguage })}
          </Text>
          <DuoButton label={t("exam.speaking.skip")} onPress={onSkip} testID="exam-speech-skip" />
        </>
      ) : gate === "needsPermission" ? (
        <>
          <Text style={styles.title}>{t("checkpoint.permissionTitle")}</Text>
          <Text style={styles.body}>{t("checkpoint.permissionBody", { language: targetLanguage })}</Text>
          <DuoButton label={t("checkpoint.allowMicrophone")} onPress={onRequest} />
          <DuoButton label={t("exam.speaking.skip")} variant="white" onPress={onSkip} />
        </>
      ) : disclosure ? (
        <>
          <Text style={styles.title}>{t("checkpoint.beforeStart")}</Text>
          <Text style={styles.body}>{tm(networkDisclosureText(targetLanguage))}</Text>
          <DuoButton label={t("checkpoint.gotItStart")} onPress={onAcknowledge} />
          <DuoButton label={t("exam.speaking.skip")} variant="white" onPress={onSkip} />
        </>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- practice

function PracticeRun({ courseId, track, sectionId }: { courseId: string; track: CompiledExamTrack; sectionId: string }) {
  const styles = useStyles();
  const { languageName } = useT();
  const profile = courseProfile(courseId);
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);
  const section = track.sections.find((s) => s.id === sectionId)!;
  const [startedAt] = useState(() => Date.now());
  const [seed] = useState(() => priorCount(courseId, examAttemptId(track.id, "practice", sectionId)));
  const definition = useMemo(() => buildExamSectionSession({ courseId, track, sectionId, formId: null, mode: "practice", attemptSeed: seed }), [courseId, track, sectionId, seed]);
  const speech = useSpeechGate(profile.recognitionLocale, section.skill === "speaking");
  const acknowledge = useProgress((s) => s.acknowledgeSpeechNotice);

  if (section.skill === "speaking" && (speech.gate !== "ok" || speech.disclosure)) {
    return (
      <SafeAreaView style={styles.screen}>
        <SpeechGateView
          gate={speech.gate}
          disclosure={speech.disclosure}
          targetLanguage={targetLanguage}
          onRequest={speech.request}
          onAcknowledge={() => {
            acknowledge();
            speech.clearDisclosure();
          }}
          onSkip={() => router.back()}
        />
      </SafeAreaView>
    );
  }
  const itemIds = sectionItems(track, sectionId, null).map((i) => i.id);
  return (
    <SessionScreen
      definition={definition}
      targetLanguage={targetLanguage}
      renderFinished={(controller) => (
        <RecordAndShow track={track} mode="practice" sectionId={sectionId} formId="bank" itemResults={itemResultsFor(itemIds, controller.state.firstResults, controller.state.firstCredits)} startedAt={startedAt} />
      )}
    />
  );
}

// ---------------------------------------------------------------- mock

type MockPhase = { kind: "intro"; index: number } | { kind: "running"; index: number; endsAt: number } | { kind: "done"; itemResults: AssessmentItemResult[] };

function MockRun({ courseId, track }: { courseId: string; track: CompiledExamTrack }) {
  const styles = useStyles();
  const { t, languageName } = useT();
  const profile = courseProfile(courseId);
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);
  const [{ form, seed }] = useState(() => {
    const prior = priorCount(courseId, examAttemptId(track.id, "mock"));
    return { form: selectMockForm(track, prior), seed: prior };
  });
  const [startedAt] = useState(() => Date.now());
  const [phase, setPhase] = useState<MockPhase>({ kind: "intro", index: 0 });
  const results = useRef<AssessmentItemResult[]>([]);
  const hasSpeaking = track.sections.some((s) => s.skill === "speaking");
  const speech = useSpeechGate(profile.recognitionLocale, hasSpeaking);
  const acknowledge = useProgress((s) => s.acknowledgeSpeechNotice);

  const definitions = useMemo(
    () => track.sections.map((s) => buildExamSectionSession({ courseId, track, sectionId: s.id, formId: form.formId, mode: "mock", attemptSeed: seed })),
    [courseId, track, form.formId, seed]
  );
  const next = (index: number) => setPhase(index + 1 < track.sections.length ? { kind: "intro", index: index + 1 } : { kind: "done", itemResults: results.current });
  const finishSection = (index: number, firstResults: Record<string, boolean>, firstCredits?: Record<string, number>) => {
    const ids = sectionItems(track, track.sections[index].id, form.formId).map((i) => i.id);
    results.current = [...results.current, ...itemResultsFor(ids, firstResults, firstCredits)];
    next(index);
  };

  if (phase.kind === "done") {
    return <RecordAndShow track={track} mode="mock" formId={form.formId} itemResults={phase.itemResults} startedAt={startedAt} />;
  }
  const section = track.sections[phase.index];

  if (phase.kind === "intro") {
    const speakingBlocked = section.skill === "speaking" && (speech.gate !== "ok" || speech.disclosure);
    return (
      <SafeAreaView style={styles.screen}>
        {speakingBlocked ? (
          <SpeechGateView
            gate={speech.gate}
            disclosure={speech.disclosure}
            targetLanguage={targetLanguage}
            onRequest={speech.request}
            onAcknowledge={() => {
              acknowledge();
              speech.clearDisclosure();
            }}
            onSkip={() => next(phase.index)}
          />
        ) : (
          <View style={styles.center} testID={`exam-mock-intro-${section.id}`}>
            <Text style={styles.kicker}>{t("exam.mock.partOf", { part: phase.index + 1, total: track.sections.length, form: form.formId.toUpperCase() })}</Text>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.body}>{t("exam.mock.sectionClock", { minutes: section.minutes })}</Text>
            {section.preparationMinutes ? <Text style={styles.body}>{t("exam.mock.preparation", { prep: section.preparationMinutes })}</Text> : null}
            {section.tasks.map((task) => (
              <Text key={task.id} style={styles.task}>
                • {task.title} — {task.instruction}
              </Text>
            ))}
            <DuoButton
              label={t("exam.mock.startSection")}
              variant="primary"
              onPress={() => setPhase({ kind: "running", index: phase.index, endsAt: Date.now() + section.minutes * 60_000 })}
              testID="exam-mock-start-section"
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  const index = phase.index;
  return (
    <SessionScreen
      key={section.id}
      definition={definitions[index]}
      targetLanguage={targetLanguage}
      countdown={{ endsAt: phase.endsAt, onExpire: (controller) => finishSection(index, controller.state.firstResults, controller.state.firstCredits) }}
      renderFinished={(controller) => <SectionDone onMount={() => finishSection(index, controller.state.firstResults, controller.state.firstCredits)} />}
    />
  );
}

/** Advances the mock once the section's session has finished (side effect after render). */
function SectionDone({ onMount }: { onMount: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    onMount();
  }, [onMount]);
  const styles = useStyles();
  return <SafeAreaView style={styles.screen} />;
}

// ---------------------------------------------------------------- weak areas

function WeakAreaRun({ courseId, track }: { courseId: string; track: CompiledExamTrack }) {
  const { t, languageName } = useT();
  const profile = courseProfile(courseId);
  const { allWords } = useCourseContent(courseId);
  const definition = useMemo(() => {
    const attempts = assessmentFor(useProgress.getState(), courseId).checkpointAttempts.filter((a) => isExamAttemptOf(a, track.id));
    const latest = attempts[attempts.length - 1];
    const lexemeIds = latest ? examWeakAreas(track, latest.itemResults).lexemeIds : [];
    return buildWeakAreaSessionDefinition({ courseId, lexemeIds, pool: allWords(), seed: latest?.completedAt ?? 0 });
    // frozen at entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, track]);
  return (
    <SessionScreen
      definition={definition}
      targetLanguage={languageName(profile.targetCode, profile.targetLanguage)}
      emptyMessage={t("exam.weak.empty")}
    />
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
    kicker: { fontSize: 13, fontWeight: "800", color: colors.textMuted },
    title: { fontSize: 24, fontWeight: "800", color: colors.neutral700, textAlign: "center" },
    body: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
    task: { fontSize: 14, color: colors.text, alignSelf: "stretch" },
  })
);
