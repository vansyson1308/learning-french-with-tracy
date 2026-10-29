/**
 * Which fields of an exercise payload are NATIVE-language text (P2b). One
 * table drives three things: the translation workflow (what to put in
 * front of a translator), the assessment overlay (`exerciseNative`: the
 * same fields in another native language, applied by the compiler), and
 * the cross-course consistency validator (everything else must be
 * identical between `fr-en` and `fr-vi`).
 *
 * Paths are dot paths with numeric segments for arrays
 * (`options.2.text`, `rubric.requiredSlots.0.description`). Target-language
 * text (French surfaces, model answers, accepted variants, form field
 * labels such as "Prénom") is never listed here.
 */

type AnyRecord = Record<string, unknown>;

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as AnyRecord)[seg];
  }
  return cur;
}

/** Immutable set: returns a copy of `obj` with `path` set to `value` (arrays stay arrays). */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const segs = path.split(".");
  const walk = (cur: unknown, i: number): unknown => {
    const seg = segs[i];
    if (i === segs.length - 1) {
      if (Array.isArray(cur)) {
        const copy = [...cur];
        copy[Number(seg)] = value;
        return copy;
      }
      return { ...(cur as AnyRecord), [seg]: value };
    }
    const child = cur === null || typeof cur !== "object" ? undefined : (cur as AnyRecord)[seg];
    const next = walk(child, i + 1);
    if (Array.isArray(cur)) {
      const copy = [...cur];
      copy[Number(seg)] = next;
      return copy;
    }
    return { ...(cur as AnyRecord), [seg]: next };
  };
  return walk(obj, 0) as T;
}

/**
 * Native-language field paths of one exercise, in a stable order. The
 * `direction`/`mode` of an exercise decides which side is native:
 * `targetToNative` shows the target and asks for the native (options,
 * answer tokens are native); `nativeToTarget` shows the native prompt.
 */
/** French exercises (unit ue) whose select prompt is an instruction in the native language, not French. */
export const NATIVE_PROMPT_EXERCISES: ReadonlySet<string> = new Set(["ue-l1-e0", "ue-l1-e1", "ue-l1-e2", "ue-l1-e3", "ue-l1-e4", "ue-l1-e6", "ue-l2-e4", "ue-l2-e7", "ue-l3-e8"]);

export function exerciseNativeFieldPaths(e: AnyRecord): string[] {
  const paths: string[] = [];
  const arr = (key: string) => (Array.isArray(e[key]) ? (e[key] as unknown[]) : []);
  const type = e.type as string;
  switch (type) {
    case "select":
      // D-10 review (fr-42…50): a few French "connected speech" questions put a native-language
      // instruction in the prompt of a targetToNative select (the French pack is frozen).
      if (e.mode === "targetToNative" && NATIVE_PROMPT_EXERCISES.has(String(e.id).replace(/^[a-z]{2}-[a-z]{2}:/, ""))) paths.push("prompt");
      if (e.mode === "targetToNative") arr("options").forEach((_, i) => paths.push(`options.${i}.text`));
      else if (e.mode === "nativeToTarget") paths.push("prompt");
      break;
    case "typeAnswer":
      if (e.mode === "translate") {
        paths.push("answer");
        arr("alternatives").forEach((_, i) => paths.push(`alternatives.${i}`));
      } else if (e.mode === "produceTarget") {
        paths.push("prompt");
      }
      break;
    case "wordBank":
      if (e.direction === "targetToNative") {
        arr("tokens").forEach((_, i) => paths.push(`tokens.${i}`));
        arr("answer").forEach((_, i) => paths.push(`answer.${i}`));
        arr("alternatives").forEach((alt, i) => (Array.isArray(alt) ? alt : []).forEach((_, j) => paths.push(`alternatives.${i}.${j}`)));
      } else if (e.direction === "nativeToTarget") {
        paths.push("prompt");
      }
      break;
    case "fillBlank":
    case "conjugationCloze":
      if (typeof e.translation === "string") paths.push("translation");
      break;
    case "articleSelect":
      paths.push("gloss");
      break;
    case "match":
      arr("pairs").forEach((_, i) => paths.push(`pairs.${i}.native`));
      break;
    case "listeningComprehension":
    case "readingComprehension":
      paths.push("question");
      arr("options").forEach((_, i) => paths.push(`options.${i}.text`));
      break;
    case "speakProduction":
      paths.push("instruction");
      arr("cueFacts").forEach((_, i) => paths.push(`cueFacts.${i}.label`));
      break;
    case "guidedWriting":
    case "simpleForm": {
      paths.push("instruction");
      arr("cueFacts").forEach((_, i) => paths.push(`cueFacts.${i}.label`));
      const rubric = e.rubric as { requiredSlots?: unknown[] } | undefined;
      (rubric?.requiredSlots ?? []).forEach((_, i) => paths.push(`rubric.requiredSlots.${i}.description`));
      break;
    }
    default:
      // dictation, speakRepetition, interactionScenario, number drills: target-language only.
      break;
  }
  return paths.filter((p) => typeof getPath(e, p) === "string");
}

/**
 * The exercise with every native field replaced from `overlay` (a dot-path
 * → string map). Fail-closed: a native field without an overlay value is an
 * error, and an overlay path that is not a native field of this exercise is
 * an error too (a typo must never silently keep the other language).
 */
export function applyExerciseOverlay(exercise: AnyRecord, overlay: Record<string, string>, where: string): AnyRecord {
  const expected = exerciseNativeFieldPaths(exercise);
  const missing = expected.filter((p) => typeof overlay[p] !== "string" || overlay[p].length === 0);
  if (missing.length > 0) throw new Error(`${where}: exerciseNative is missing ${missing.join(", ")}`);
  const unknown = Object.keys(overlay).filter((p) => !expected.includes(p));
  if (unknown.length > 0) throw new Error(`${where}: exerciseNative has non-native paths ${unknown.join(", ")}`);
  let out = exercise;
  for (const p of expected) out = setPath(out, p, overlay[p]);
  return out;
}

/** Overlay paths an item of `nativeCode` still needs (validator helper; empty = complete). */
export function missingOverlayPaths(exercise: AnyRecord, overlay: Record<string, string> | undefined): string[] {
  return exerciseNativeFieldPaths(exercise).filter((p) => typeof overlay?.[p] !== "string" || overlay[p].length === 0);
}

/**
 * Native-language fields of a course PACK outside the exercises: section
 * and unit titles, unit descriptions and guidebooks, lesson titles and the
 * native side of every taught word. Paths are relative to the pack.
 */
export function packNativeFieldPaths(pack: {
  sections: { title: string; units: { title: string; description: string; guidebook: string; words: { native: string }[]; lessons: { title: string; exercises: AnyRecord[] }[] }[] }[];
}): { path: string; exercise?: AnyRecord; exercisePath?: string }[] {
  const out: { path: string; exercise?: AnyRecord; exercisePath?: string }[] = [];
  pack.sections.forEach((section, s) => {
    out.push({ path: `sections.${s}.title` });
    section.units.forEach((unit, u) => {
      const base = `sections.${s}.units.${u}`;
      out.push({ path: `${base}.title` }, { path: `${base}.description` }, { path: `${base}.guidebook` });
      unit.words.forEach((_, w) => out.push({ path: `${base}.words.${w}.native` }));
      unit.lessons.forEach((lesson, l) => {
        out.push({ path: `${base}.lessons.${l}.title` });
        lesson.exercises.forEach((exercise, x) => {
          const ePath = `${base}.lessons.${l}.exercises.${x}`;
          for (const p of exerciseNativeFieldPaths(exercise)) out.push({ path: `${ePath}.${p}`, exercise, exercisePath: ePath });
        });
      });
    });
  });
  return out;
}
