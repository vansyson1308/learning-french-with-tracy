/**
 * P3h device-acceptance generator: every shipped course's first lesson,
 * the scored checkpoint and the walk are fully automatable from content;
 * every testID a flow taps exists in the app; typed answers are ASCII the
 * course's own grader accepts; and the backup tools round-trip the RC3
 * seed through the app's import path.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

import { audioServiceStarts, maxPiid, sessionPlays } from "../device/audio-evidence";
import { learnerSummary, seedRc3Envelope } from "../device/backup-tools";
import { APP_ID, asciiFold, buildSuite, literal, PICKER_LABELS } from "../device/maestro-flows";

const { files, problems } = buildSuite();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}
const APP_SOURCE = ["src/app", "src/components"].flatMap(sourceFiles).map((f) => readFileSync(f, "utf8")).join("\n");

describe("maestro suite", () => {
  test("everything is automatable", () => {
    expect(problems).toEqual([]);
  });

  test("one lesson flow per shipped course, plus the walk and RC3 flows", () => {
    const lessons = Object.keys(files).filter((f) => f.startsWith("lesson-"));
    expect(lessons.length).toBeGreaterThanOrEqual(10);
    for (const name of [
      "onboarding-vi.yaml", "onboarding-en.yaml", "screens-vi.yaml", "screens-en.yaml", "today.yaml",
      "checkpoint.yaml", "speech-unavailable.yaml", "exam-mock.yaml", "export.yaml", "import-vi.yaml",
      "profile.yaml", "rc3-onboarding.yaml", "rc3-import.yaml", "rc3-export.yaml",
    ]) {
      expect(files[name]).toBeDefined();
    }
  });

  test("every flow targets the app and every id it uses exists in the UI", () => {
    const missing = new Set<string>();
    for (const [name, yaml] of Object.entries(files)) {
      if (!name.endsWith(".yaml")) continue;
      expect(yaml).toContain("appId: com.vansyson1308.learningfrenchwithtracy");
      if (name.startsWith("rc3-")) {
        expect(yaml).not.toMatch(/^\s*id:/m); // RC3 predates the testIDs
        continue;
      }
      for (const [, selector] of yaml.matchAll(/^\s*id: "(.*)"$/gm)) {
        // A selector is a regex: check each alternative's literal stem.
        const group = /^(.*)\((.*)\)(.*)$/.exec(selector);
        const alts = group ? group[2].split("|").map((a) => `${group[1]}${a}${group[3]}`) : selector.split("|");
        for (const alt of alts) {
          const stem = alt.split(/\\\\[.:]|[.(*]/)[0].replace(/\\\\/g, "");
          if (stem.startsWith("exercise-")) continue; // `exercise-${id}` wrapper, checked below
          const parts = stem.split("-");
          const templates = parts.map((_, i) => `${parts.slice(0, i + 1).join("-")}-\${`);
          const found = APP_SOURCE.includes(`"${stem}"`) || templates.some((t) => APP_SOURCE.includes(`\`${t}`));
          if (!found) missing.add(`${name}: ${alt}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
    expect(APP_SOURCE).toContain("testID={`exercise-${step.exercise.id}`}");
  });

  test("typed answers are plain ASCII (adb input)", () => {
    for (const yaml of Object.values(files).filter((f) => f.startsWith("#"))) {
      for (const [, typed] of yaml.matchAll(/inputText: "(.*)"$/gm)) expect(typed).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  test("courses.tsv lists every lesson flow with its bundled clip count", () => {
    const rows = files["courses.tsv"].trim().split("\n").map((r) => r.split("\t"));
    expect(rows.map(([id]) => `lesson-${id}.yaml`).sort()).toEqual(Object.keys(files).filter((f) => f.startsWith("lesson-")).sort());
    expect(rows.find(([id]) => id === "es-vi")?.[1]).not.toBe("0");
  });

  test("the checkpoint flow asserts a full first-try score", () => {
    expect(files["checkpoint.yaml"]).toMatch(/id: "checkpoint-first-try"\n\s+text: "\.\*(\d+)\/\1\.\*"/);
  });

  test("every scroll centres its target (API 30 navigation bar overlaps the screen edge)", () => {
    for (const [name, yaml] of Object.entries(files)) {
      if (!name.endsWith(".yaml")) continue;
      const scrolls = yaml.split("- scrollUntilVisible:").slice(1);
      for (const block of scrolls) {
        const step = block.split("\n- ")[0];
        expect(step).toContain("centerElement: true");
        expect(step).toContain("timeout: 60000"); // the centering fallback fits on a ticking screen
      }
    }
  });

  test("the profile flow scrolls to the import button itself", () => {
    expect(files["profile.yaml"]).toMatch(/scrollUntilVisible:\n\s+element:\n\s+id: "profile-import"/);
  });

  test("the picker step knows the vi-VN and en-US DocumentsUI labels", () => {
    for (const label of ["Downloads", "Tệp đã tải xuống", "Recent", "Gần đây"]) {
      expect(PICKER_LABELS.landmarks.split("|")).toContain(label);
    }
    expect(files["import-vi.yaml"]).toContain(JSON.stringify(PICKER_LABELS.downloads));
    expect(files["rc3-import.yaml"]).toContain(JSON.stringify(PICKER_LABELS.downloads));
  });

  test("the Vietnamese walk asserts Vietnamese UI text", () => {
    expect(files["onboarding-vi.yaml"]).toContain("Chào mừng!");
    expect(files["onboarding-en.yaml"]).toContain("Welcome!");
  });
});

describe("helpers", () => {
  test("literal escapes regex syntax", () => {
    expect(literal("¿Qué? (sí)")).toBe("¿Qué\\? \\(sí\\)");
  });
  test("asciiFold strips accents and Spanish punctuation", () => {
    expect(asciiFold("¿La niña bebe leche?")).toBe("La nina bebe leche?");
    expect(asciiFold("Tôi là phụ nữ. Đúng")).toBe("Toi la phu nu. Dung");
  });
});

describe("backup tools", () => {
  test("the RC3 seed is an RC3-format backup the current import path accepts", () => {
    const seed = seedRc3Envelope(new Date("2026-10-27T08:00:00Z"));
    expect(seed.envelopeVersion).toBe(1);
    expect(seed.persistVersion).toBe(3);
    const summary = learnerSummary(JSON.stringify(seed), new Date("2026-10-27T08:00:00Z"));
    expect(summary.streak).toBe(5);
    expect(summary.lastActiveDay).toBe("2026-10-27");
    expect(summary.cards).toBeGreaterThan(0);
    expect(JSON.stringify(summary.assessmentByTarget)).toContain("placement");
  });
});

describe("audio evidence", () => {
  const api34 = `10-27 14:58:01.100  555  600 D MediaSessionService: onPlaybackStateChanged(): ${APP_ID} : PlaybackState {state=PLAYING(3), position=0, buffered position=0, speed=1.0}
10-27 14:58:02.100  555  600 D MediaSessionService: onPlaybackStateChanged(): ${APP_ID} : PlaybackState {state=PAUSED(2), position=900}
10-27 14:58:03.100  555  600 D MediaSessionService: onPlaybackStateChanged(): other.app : PlaybackState {state=PLAYING(3), position=0}`;
  const api30 = `10-27 14:58:01.100  555  600 D MediaSessionService: onPlaybackStateChanged(): ${APP_ID} : PlaybackState {state=3, position=0, buffered position=0}
10-27 14:58:02.100  555  600 D MediaSessionService: onPlaybackStateChanged(): ${APP_ID} : PlaybackState {state=2, position=900}`;

  test("media-session plays: API 33+ names the state, API 30-32 prints the number", () => {
    expect(sessionPlays(api34, APP_ID)).toBe(1);
    expect(sessionPlays(api30, APP_ID)).toBe(1);
    expect(sessionPlays(api30.replace("state=3,", "state=32,"), APP_ID)).toBe(0);
  });

  const dumpsys = `
  playback activity as reported through PlayerBase:
  ID:41 -- type:android.media.AudioTrack -- u/pid:10153/7001 -- state:paused -- attr:AudioAttributes:
10-27 14:57:00:001 new player piid:31 uid/pid:10153/7001 type:android.media.AudioTrack attr:AudioAttributes: usage=USAGE_MEDIA session:17
10-27 14:57:00:050 player piid:31 state:started
10-27 14:58:00:001 new player piid:41 uid/pid:10153/7001 type:android.media.AudioTrack attr:AudioAttributes: usage=USAGE_MEDIA session:25
10-27 14:58:00:050 player piid:41 event:started
10-27 14:58:00:900 player piid:41 event:paused
10-27 14:58:01:001 new player piid:43 uid/pid:1000/650 type:android.media.SoundPool attr:AudioAttributes: session:0
10-27 14:58:01:050 player piid:43 state:started
10-27 14:58:02:001 new player piid:45 uid/pid:10153/7001 type:android.media.AudioTrack attr:AudioAttributes: session:27
`;

  test("audio-service starts: only the app's players created after the floor", () => {
    expect(maxPiid(dumpsys)).toBe(45);
    expect(audioServiceStarts(dumpsys, 10153, 0)).toBe(2);
    expect(audioServiceStarts(dumpsys, 10153, 31)).toBe(1); // piid 31 predates the lesson
    expect(audioServiceStarts(dumpsys, 10153, 41)).toBe(0); // 45 never started
    expect(audioServiceStarts(dumpsys, 1000, 0)).toBe(1);
  });
});
