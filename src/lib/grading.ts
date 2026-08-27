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

export function checkAnswer(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
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
    case "wordBank":
      return exercise.answer.join(" ");
    case "typeAnswer":
      return exercise.answer;
    case "match":
      return "";
  }
}

export function answerIsReady(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
      return typeof answer === "number";
    case "wordBank":
      return Array.isArray(answer) && answer.length > 0;
    case "typeAnswer":
      return typeof answer === "string" && answer.trim().length > 0;
    case "match":
      return answer === "done";
  }
}
