import type { Exercise } from "./types";

export type Status = "none" | "correct" | "wrong";
export type Answer = number | number[] | string | null;

export function normalize(text: string) {
  return (
    text
      // Smart/modifier apostrophes → ASCII. iOS smart punctuation types
      // U+2019, while the packs use ASCII ' — without this, correct French
      // answers like l’eau were marked wrong.
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      // No-break and narrow spaces → plain space (French keyboards emit
      // U+00A0/U+202F before punctuation).
      .replace(/[\u00A0\u202F\u2009]/g, " ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Ligatures NFD leaves intact: œufs ≡ oeufs.
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      // Punctuation stripped (now also guillemets, curly quotes, ellipsis).
      .replace(/[.,!?¿¡;:"'、。！？«»“”…]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}


/**
 * STRICT French comparison for grammar production (conjugationCloze):
 * apostrophe/space variants unified and case-insensitive, but accents and
 * exact inflection are preserved — "mange" ≠ "mangé" ≠ "manges" here.
 */
export function strictFrenchEquals(a: string, b: string): boolean {
  const fold = (t: string) =>
    t
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/[\u00A0\u202F\u2009]/g, " ")
      .normalize("NFC")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  return fold(a) === fold(b);
}

export function checkAnswer(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "articleSelect":
      return answer === exercise.correct;
    case "wordBank": {
      if (!Array.isArray(answer)) return false;
      const attempt = answer.map((i) => exercise.tokens[i]).join(" ");
      return normalize(attempt) === normalize(exercise.answer.join(" "));
    }
    case "typeAnswer": {
      if (typeof answer !== "string") return false;
      const attempt = normalize(answer);
      return [exercise.answer, ...exercise.alternatives].some(
        (a) => normalize(a) === attempt
      );
    }
    case "conjugationCloze":
    case "dictation": {
      // Dictation shares the strict contract (P7 §63): orthographic
      // decoding is the construct, so accents and exact forms matter.
      if (typeof answer !== "string") return false;
      return [exercise.answer, ...exercise.alternatives].some((a) =>
        strictFrenchEquals(a, answer)
      );
    }
    case "listeningComprehension":
    case "readingComprehension":
      return answer === exercise.correct;
    case "match":
      return answer === "done";
  }
}

export function correctAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case "select":
      return exercise.options[exercise.correct].text;
    case "fillBlank":
      return exercise.sentence.replace("___", exercise.options[exercise.correct]);
    case "articleSelect":
      return `${exercise.articles[exercise.correct]} ${exercise.noun}`;
    case "wordBank":
      return exercise.answer.join(" ");
    case "typeAnswer":
      return exercise.answer;
    case "conjugationCloze":
      return exercise.sentence.replace("___", exercise.answer);
    case "dictation":
      return exercise.answer;
    case "listeningComprehension":
    case "readingComprehension":
      return exercise.options[exercise.correct].text;
    case "match":
      return "";
  }
}

export function answerIsReady(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "articleSelect":
      return typeof answer === "number";
    case "wordBank":
      return Array.isArray(answer) && answer.length > 0;
    case "typeAnswer":
    case "conjugationCloze":
    case "dictation":
      return typeof answer === "string" && answer.trim().length > 0;
    case "listeningComprehension":
    case "readingComprehension":
      return typeof answer === "number";
    case "match":
      return answer === "done";
  }
}
