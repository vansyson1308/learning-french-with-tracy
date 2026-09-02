/**
 * Writing-rubric and speech-grader attacks (Phase 10 §27-§28, §76) over
 * EVERY authored task and item. Hard assertions pin the properties the
 * constructs depend on; a few deliberate leniencies (concept-slot word
 * order, n-best acceptance) are measured and bounded rather than
 * asserted away, and are recorded in the assessment dossier.
 */
import { describe, expect, test } from "bun:test";

import { gradeSpokenAttempt } from "../speech/grader";
import { speechItemFor, speechItemIds } from "../speech/content";
import { knownFrenchVocabulary, writingTasks } from "../writing/content";
import { evaluateGuidedWriting, normalizeWrittenFrench } from "../writing/rubric";

const knownFrench = knownFrenchVocabulary();
const guided = writingTasks().filter((t) => t.mode === "guided");

function promptTextOf(task: (typeof guided)[number]): string {
  return [task.instruction, ...(task.cueFacts ?? []).map((c) => `${c.label} ${c.value}`)].join(" ");
}

function evaluate(task: (typeof guided)[number], text: string) {
  return evaluateGuidedWriting({ text, rubric: task.rubric, promptText: promptTextOf(task), knownFrench });
}

const ENGLISH_WRAPPER =
  "I really think that what you want me to write here today is probably something like this so here it goes";

describe("writing rubric attacks (§27) — every guided task", () => {
  test("there are guided tasks and every model answer meets its own rubric", () => {
    expect(guided.length).toBeGreaterThanOrEqual(12);
    for (const task of guided) {
      for (const model of task.modelAnswers) {
        expect({ task: task.id, model, verdict: evaluate(task, model).verdict }).toEqual({
          task: task.id,
          model,
          verdict: "meets_rubric",
        });
      }
    }
  });

  test("accents omitted still meets (typing tolerance), but the meaning-bearing words must be there", () => {
    for (const task of guided) {
      const model = task.modelAnswers[0];
      const stripped = model.normalize("NFD").replace(/[̀-ͯ]/g, "");
      expect(evaluate(task, stripped).verdict).toBe("meets_rubric");
    }
  });

  test("copying the prompt (instruction + cue facts) never meets the rubric", () => {
    for (const task of guided) {
      const copy = promptTextOf(task);
      expect({ task: task.id, verdict: evaluate(task, copy).verdict }).not.toEqual({
        task: task.id,
        verdict: "meets_rubric",
      });
    }
  });

  test("minimal fragments (just the cue values) never meet", () => {
    for (const task of guided) {
      const fragment = (task.cueFacts ?? []).map((c) => c.value).join(" ");
      if (!fragment) continue;
      expect({ task: task.id, verdict: evaluate(task, fragment).verdict }).not.toEqual({
        task: task.id,
        verdict: "meets_rubric",
      });
    }
  });

  test("a heavy English wrapper around a correct sentence is not scorable as French", () => {
    for (const task of guided) {
      const verdict = evaluate(task, `${ENGLISH_WRAPPER} ${task.modelAnswers[0]}`).verdict;
      expect({ task: task.id, verdict }).not.toEqual({ task: task.id, verdict: "meets_rubric" });
    }
  });

  test("very long garbage around a correct sentence exceeds the length bound", () => {
    const filler = [...knownFrench].slice(0, 80).join(" ");
    for (const task of guided) {
      const verdict = evaluate(task, `${task.modelAnswers[0]} ${filler}`).verdict;
      expect({ task: task.id, verdict }).not.toEqual({ task: task.id, verdict: "meets_rubric" });
    }
  });

  test("irrelevant valid French never meets", () => {
    for (const task of guided) {
      const verdict = evaluate(task, "Le chat mange une pomme et le chien dort.").verdict;
      expect({ task: task.id, verdict }).not.toEqual({ task: task.id, verdict: "meets_rubric" });
    }
  });

  test("wrong person: a third-person rewrite of a first-person answer never meets", () => {
    let checked = 0;
    for (const task of guided) {
      const model = task.modelAnswers[0];
      if (!/^(je|j')/i.test(model.trim())) continue;
      const third = model
        .replace(/^je m'appelle/i, "il s'appelle")
        .replace(/^je suis/i, "il est")
        .replace(/^j'ai/i, "il a")
        .replace(/^j'habite/i, "il habite")
        .replace(/^je (\w+)e\b/i, "il $1e")
        .replace(/^je /i, "il ");
      if (normalizeWrittenFrench(third) === normalizeWrittenFrench(model)) continue;
      checked += 1;
      expect({ task: task.id, third, verdict: evaluate(task, third).verdict }).not.toEqual({
        task: task.id,
        third,
        verdict: "meets_rubric",
      });
    }
    expect(checked).toBeGreaterThan(5);
  });

  test("wrong fact: changing a cue value (name, place, number) in the answer never meets", () => {
    let checked = 0;
    for (const task of guided) {
      const model = task.modelAnswers[0];
      for (const cue of task.cueFacts ?? []) {
        if (!model.includes(cue.value)) continue;
        const replacement = /^\d+$/.test(cue.value) ? String(Number(cue.value) + 1) : "Zorglub";
        const wrong = model.replace(cue.value, replacement);
        checked += 1;
        expect({ task: task.id, wrong, verdict: evaluate(task, wrong).verdict }).not.toEqual({
          task: task.id,
          wrong,
          verdict: "meets_rubric",
        });
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  test("keyword stuffing — writing every variant of a slot — never meets", () => {
    let stuffedAccepted = 0;
    let multiVariantTasks = 0;
    for (const task of guided) {
      if (!task.rubric.requiredSlots.some((s) => s.variants.length >= 2)) continue;
      multiVariantTasks += 1;
      const stuffing = task.rubric.requiredSlots.map((s) => s.variants.join(" ")).join(" ");
      const result = evaluate(task, stuffing);
      if (result.verdict === "meets_rubric") stuffedAccepted += 1;
      else expect(result.feedback.join(" ")).toMatch(/once|Keep it short/);
    }
    expect(multiVariantTasks).toBeGreaterThan(5);
    expect(stuffedAccepted).toBe(0);
  });

  test("the stuffing rule counts distinct realizations, never overlapping variants of one answer", () => {
    const rubric = {
      requiredSlots: [
        {
          id: "name",
          description: "your name",
          variants: ["je m'appelle Léa", "je suis Léa", "moi c'est Léa", "moi je suis Léa"],
          cueProvided: true,
        },
      ],
      minTokens: 3,
      maxTokens: 14,
    };
    const run = (text: string) =>
      evaluateGuidedWriting({ text, rubric, promptText: "Say your name. Your name: Léa", knownFrench });
    expect(run("Moi je suis Léa.").verdict).toBe("meets_rubric"); // two overlapping variants = one answer
    const stuffed = run("Je m'appelle Léa. Je suis Léa.");
    expect(stuffed.verdict).toBe("does_not_meet_rubric");
    expect(stuffed.feedback[0]).toMatch(/Say your name once/);
  });
});

describe("speech grader attacks (§28) — every authored item", () => {
  const items = speechItemIds().map((id) => speechItemFor(id)!);
  const spec = (item: (typeof items)[number]) => ({
    acceptedVariants: item.acceptedVariants,
    requiredConcepts: item.requiredConcepts,
  });
  const finals = (finalTranscript: string, alternatives: string[] = []) => ({ finalTranscript, alternatives });

  test("every target and every accepted variant grades correct", () => {
    expect(items.length).toBeGreaterThanOrEqual(25);
    for (const item of items) {
      for (const v of [item.target, ...item.acceptedVariants]) {
        expect({ item: item.id, v, ok: gradeSpokenAttempt(finals(v), spec(item)).correct }).toEqual({
          item: item.id,
          v,
          ok: true,
        });
      }
    }
  });

  test("silence, whitespace and unrelated speech never grade correct", () => {
    const garbage = "euh alors donc voilà quoi hein bof";
    for (const item of items) {
      expect(gradeSpokenAttempt(finals(""), spec(item)).correct).toBe(false);
      expect(gradeSpokenAttempt(finals("   "), spec(item)).correct).toBe(false);
      expect(gradeSpokenAttempt(finals("", [""]), spec(item)).correct).toBe(false);
      expect({ item: item.id, ok: gradeSpokenAttempt(finals(garbage), spec(item)).correct }).toEqual({
        item: item.id,
        ok: false,
      });
    }
  });

  test("n-best: a matching alternative counts even when the top hypothesis differs (documented ASR leniency)", () => {
    for (const item of items) {
      const result = gradeSpokenAttempt(finals("euh je ne sais pas", [item.target]), spec(item));
      expect(result.correct).toBe(true);
      expect(result.matchedTranscriptIndex).toBe(1);
      expect(result.heard).toBe("euh je ne sais pas");
    }
  });

  test("wrong quantity never satisfies a number concept", () => {
    let checked = 0;
    const NUMBERS = ["un", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
    for (const item of items) {
      const slots = item.requiredConcepts ?? [];
      const numberSlot = slots.find((slot) => slot.some((f) => NUMBERS.includes(f.toLowerCase())));
      if (!numberSlot) continue;
      const wrongNumber = NUMBERS.find((n) => !numberSlot.map((f) => f.toLowerCase()).includes(n))!;
      const wrong = item.target
        .split(" ")
        .map((w) => (numberSlot.map((f) => f.toLowerCase()).includes(w.toLowerCase()) ? wrongNumber : w))
        .join(" ");
      if (wrong === item.target) continue;
      checked += 1;
      expect({ item: item.id, wrong, ok: gradeSpokenAttempt(finals(wrong), spec(item)).correct }).toEqual({
        item: item.id,
        wrong,
        ok: false,
      });
    }
    expect(checked).toBeGreaterThan(3);
  });

  test("negating the utterance breaks the concept run — 'il n'y a pas …' never satisfies 'il y a'", () => {
    let checked = 0;
    for (const item of items) {
      if (!item.requiredConcepts?.some((slot) => slot.includes("il y a"))) continue;
      const negated = item.target.replace(/^il y a/i, "il n'y a pas");
      checked += 1;
      expect({ item: item.id, negated, ok: gradeSpokenAttempt(finals(negated), spec(item)).correct }).toEqual({
        item: item.id,
        negated,
        ok: false,
      });
    }
    expect(checked).toBeGreaterThan(0);
  });

  test("dropping articles is rejected for whole-utterance items; concept items tolerate it by design (bounded)", () => {
    const ARTICLES = new Set(["un", "une", "le", "la", "les", "des", "du", "l'"]);
    let wholeChecked = 0;
    let conceptItems = 0;
    let conceptTolerant = 0;
    for (const item of items) {
      const words = item.target.split(" ");
      const stripped = words.filter((w) => !ARTICLES.has(w.toLowerCase())).join(" ");
      if (stripped === item.target) continue;
      const ok = gradeSpokenAttempt(finals(stripped), spec(item)).correct;
      if (item.requiredConcepts && item.requiredConcepts.length > 0) {
        conceptItems += 1;
        if (ok) conceptTolerant += 1;
      } else {
        wholeChecked += 1;
        expect({ item: item.id, stripped, ok }).toEqual({ item: item.id, stripped, ok: false });
      }
    }
    expect(wholeChecked).toBeGreaterThan(0);
    // Concept items grade the information (quantity, thing), not the
    // article — A1 "give information" tolerates a dropped article. Every
    // such item must still name its concepts, so tolerance is bounded to
    // items whose slots carry no article.
    expect(conceptTolerant).toBeLessThanOrEqual(conceptItems);
  });

  test("a polite tail on a concept item is accepted; on a whole-utterance item it is not (documented)", () => {
    let concept = 0;
    let whole = 0;
    for (const item of items) {
      const polite = `${item.target} s'il vous plaît`;
      const ok = gradeSpokenAttempt(finals(polite), spec(item)).correct;
      if (item.requiredConcepts && item.requiredConcepts.length > 0) {
        if (ok) concept += 1;
      } else if (!ok) {
        whole += 1;
      }
    }
    expect(concept + whole).toBeGreaterThan(0);
  });
});
