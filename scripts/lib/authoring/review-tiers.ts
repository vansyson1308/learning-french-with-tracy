/**
 * Tiered native review (P3e §8). Replaces the line-per-string checklist
 * (thousands of lines) with two short, high-impact files:
 *
 *   content/<lang>/REVIEW-TIER1-<native>.md — the learner's-language prose
 *     that teaches or judges (guidebooks, concept cards, exam instructions,
 *     writing instructions and rubric slots, scenario goals and prompts),
 *     grouped by unit, Spanish shown for context. The owner signs this one.
 *   content/<lang>/REVIEW-TIER1-<lang>.md — the target-language text a
 *     learner reads or hears at length (readings, listening scripts,
 *     scenario partner lines, model answers, speech targets, exam texts),
 *     for a hired teacher, with a short brief in Vietnamese and English.
 *
 * Everything else is covered by the automated tier: the validators, the
 * LanguageTool gate (scripts/languagetool.ts) and the back-translation pass
 * (content/<lang>/_drafts/BACKTRANSLATION.md).
 */

import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { examTrackPaths } from "../exam-bank";
import { readJson, safeResolve } from "../pipeline";

export const TIER1_NATIVE_MAX_LINES = 600;
export const TIER1_TARGET_MAX_LINES = 500;

type Native = Record<string, string>;
type Unit = PackSource["sections"][number]["units"][number];
type Concept = { id: string; title: Native; shortRule: Native; explanation: Native; memoryHint?: Native; exceptions?: Native[]; examples?: { target: string }[] };
type ScenarioNode = { kind: string; id: string; text?: string; prompt?: Native };
type Scenario = { id: string; title: Native; goal: Native; nodes: Record<string, ScenarioNode> };
type WritingTask = { id: string; instruction: Native; rubric?: { requiredSlots?: { id: string; description: Native }[] }; modelAnswers?: string[] };
type ExamTask = { id: string; title: Native; instruction: Native };
type ExamSection = { id: string; title: Native; tasks: ExamTask[] };
type Exam = { id: string; title: Native; description?: Native; sections: ExamSection[] };
type Reading = { id: string; use?: string; title?: Native; blocks?: { text: string }[]; texts?: { text: string }[] };
type Clip = { id: string; use?: string; kind: string; segments: { speaker?: string; text: string }[] };
type SpeechItem = { id: string; target: string };

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const opt = <T>(rel: string): T | null => (existsSync(safeResolve(rel)) ? (readJson(rel) as T) : null);

/** The guidebook as a few lines: one per heading section, bullets joined. */
function guidebookLines(md: string): string[] {
  const out: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) out.push(current.join(" · "));
    current = [];
  };
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    if (/^#{1,6}\s/.test(line)) {
      flush();
      current.push(`**${line.replace(/^#+\s*/, "")}**`);
    } else {
      current.push(line.replace(/^[-*]\s+/, ""));
    }
  }
  flush();
  return out;
}

/** Unit that first mentions an id (lesson flows, exercise payloads); undefined = review/exam only. */
function unitIndex(pack: PackSource): (id: string) => string | undefined {
  const units = pack.sections.flatMap((s) => s.units).map((u) => ({ id: u.id, blob: JSON.stringify(u.lessons) }));
  return (id) => units.find((u) => u.blob.includes(`"${id}"`))?.id;
}

export function renderTier1Native(courseId: string): string {
  const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
  const lang = pack.targetCode;
  const nat = pack.nativeCode;
  const unitOf = unitIndex(pack);
  const concepts = opt<{ concepts: Concept[] }>(`content/${lang}/pedagogy/concepts.json`)?.concepts ?? [];
  const scenarios = opt<{ scenarios: Scenario[] }>(`content/${lang}/interaction/scenarios.json`)?.scenarios ?? [];
  const writing = opt<{ tasks: WritingTask[] }>(`content/${lang}/writing/tasks.json`)?.tasks ?? [];

  const byUnit = new Map<string, string[]>();
  const later: string[] = [];
  const put = (id: string, lines: string[]) => {
    const u = unitOf(id);
    if (u) byUnit.set(u, [...(byUnit.get(u) ?? []), ...lines]);
    else later.push(...lines);
  };
  for (const c of concepts) {
    const ex = (c.examples ?? []).slice(0, 2).map((e) => `*${e.target}*`).join(", ");
    put(c.id, [
      `- [ ] Khái niệm \`${c.id}\` — **${c.title[nat]}** — ${c.shortRule[nat]}${ex ? ` (${ex})` : ""}`,
      `  - ${oneLine(c.explanation[nat])}${c.memoryHint ? ` — Mẹo: ${oneLine(c.memoryHint[nat])}` : ""}${(c.exceptions ?? []).length ? ` — Ngoại lệ: ${(c.exceptions ?? []).map((e) => oneLine(e[nat])).join("; ")}` : ""}`,
    ]);
  }
  for (const w of writing) {
    const slots = (w.rubric?.requiredSlots ?? []).map((s) => s.description[nat]).join(" · ");
    put(w.id, [`- [ ] Viết \`${w.id}\` — ${oneLine(w.instruction[nat])}${slots ? ` — Ý cần có: ${slots}` : ""}${w.modelAnswers?.[0] ? ` — Mẫu: *${oneLine(w.modelAnswers[0])}*` : ""}`]);
  }
  for (const s of scenarios) {
    const nodes = Object.values(s.nodes);
    const opening = nodes.find((n) => n.kind === "partner")?.text;
    const prompts = [...new Set(nodes.filter((n) => n.kind === "learner" && n.prompt).map((n) => n.prompt![nat]))];
    put(s.id, [`- [ ] Hội thoại \`${s.id}\` — **${s.title[nat]}** — Mục tiêu: ${s.goal[nat]}${opening ? ` — Mở đầu: *${opening}*` : ""} — Lời nhắc: ${prompts.join(" · ")}`]);
  }

  const out = [
    `# Review Tier 1 — tiếng Việt (${courseId})`,
    "",
    `Những câu chữ tiếng Việt **dạy hoặc chấm** người học: sổ tay từng chương, thẻ khái niệm, đề viết và tiêu chí chấm, mục tiêu và lời nhắc hội thoại, hướng dẫn thi. Tiếng Tây Ban Nha in nghiêng chỉ để đối chiếu. Đánh dấu [x] khi câu đúng và tự nhiên; sửa ngay trong nguồn (đường dẫn theo id) hoặc ghi chú bên cạnh. Khi xong, ghi \`review: { native: "<tên>", date: "YYYY-MM-DD", checklist: "content/${lang}/REVIEW-TIER1-${nat}.md" }\` vào \`content/courses/${courseId}.profile.json\` — nhãn "Bản beta" trong app sẽ tự tắt.`,
    "",
    `Sinh bởi \`bun scripts/author.ts review-tiers --course ${courseId}\`. Phần còn lại (nhãn từ, lựa chọn, câu dịch) do tầng tự động kiểm: validators, LanguageTool, đối chiếu dịch ngược (\`content/${lang}/_drafts/BACKTRANSLATION.md\`).`,
    "",
  ];
  for (const s of pack.sections) {
    for (const u of s.units as Unit[]) {
      out.push(`## ${u.id} — ${u.title}`, "");
      if (u.description) out.push(`- [ ] Mô tả: ${oneLine(u.description)}`);
      if (u.guidebook) for (const g of guidebookLines(u.guidebook)) out.push(`- [ ] ${g}`);
      out.push(...(byUnit.get(u.id) ?? []), "");
    }
  }
  if (later.length) out.push("## Ôn tập, kiểm tra (ngoài bài học)", "", ...later, "");
  for (const rel of examTrackPaths(lang)) {
    const exam = readJson(rel) as Exam;
    out.push(`## Thi — ${exam.title[nat]} (\`${exam.id}\`)`, "");
    if (exam.description) out.push(`- [ ] ${oneLine(exam.description[nat])}`);
    for (const sec of exam.sections) {
      for (const t of sec.tasks) out.push(`- [ ] ${sec.title[nat]} · ${t.title[nat]} — ${oneLine(t.instruction[nat])}`);
    }
    out.push("");
  }
  return out.join("\n");
}

export function renderTier1Target(courseId: string): string {
  const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
  const lang = pack.targetCode;
  const readings = opt<{ readings: Reading[] }>(`content/${lang}/reception/reading.json`)?.readings ?? [];
  const clips = opt<{ clips: Clip[] }>(`content/${lang}/reception/listening.json`)?.clips ?? [];
  const scenarios = opt<{ scenarios: Scenario[] }>(`content/${lang}/interaction/scenarios.json`)?.scenarios ?? [];
  const writing = opt<{ tasks: WritingTask[] }>(`content/${lang}/writing/tasks.json`)?.tasks ?? [];
  const speech = opt<{ items: SpeechItem[] }>(`content/${lang}/speech/items.json`)?.items ?? [];

  const readingLines = (r: Reading) => (r.blocks ?? r.texts ?? []).map((b, i) => `- [ ] \`${r.id}\`${(r.blocks ?? r.texts ?? []).length > 1 ? ` (${i + 1})` : ""} — ${oneLine(b.text)}`);
  const clipLine = (c: Clip) => `- [ ] \`${c.id}\` — ${c.segments.map((s) => `${s.speaker ? `${s.speaker}: ` : ""}${oneLine(s.text)}`).join(" / ")}`;
  // Single words and short phrases are covered by LanguageTool; a teacher reads connected speech.
  const connected = (c: Clip) => words(c.segments.map((s) => s.text).join(" ")) >= 6;

  const out = [
    `# Review Tier 1 — español (${courseId})`,
    "",
    "## Hướng dẫn cho người duyệt / Brief for the reviewer",
    "",
    "**Tiếng Việt.** Cảm ơn bạn đã duyệt! Đây là các văn bản tiếng Tây Ban Nha dài nhất mà người học Việt Nam đọc hoặc nghe trong khoá A1 (khoảng 2–3 giờ). Chuẩn là **tiếng Tây Ban Nha bán đảo (Tây Ban Nha)**, trình độ **A1** (CEFR), giọng tự nhiên — không dịch máy, không quá trang trọng. Với mỗi dòng: đánh dấu [x] nếu đúng và tự nhiên; nếu không, ghi cách sửa ngay dưới dòng đó. Các tên riêng Việt Nam (Minh, Linh…) là cố ý. Từ Mỹ Latinh chỉ nằm trong danh sách đáp án chấp nhận, không xuất hiện ở đây.",
    "",
    "**English.** Thank you for reviewing! These are the longest Spanish texts a Vietnamese A1 learner reads or hears in this course (about 2–3 hours). The standard is **Peninsular Spanish (Spain)** at **CEFR A1**, natural register — no machine-translation flavour, not overly formal. For each line: tick [x] if it is correct and natural; otherwise write the correction directly under the line. Vietnamese names (Minh, Linh…) are intentional. Latin-American forms appear only in accepted-answer lists, never here. Single words and short phrases are already machine-checked (LanguageTool), so they are not listed.",
    "",
    `Generated by \`bun scripts/author.ts review-tiers --course ${courseId}\`.`,
    "",
  ];
  const section = (title: string, lines: string[]) => {
    if (lines.length) out.push(`## ${title} (${lines.length})`, "", ...lines, "");
  };
  section("Exam — reading texts / Thi — bài đọc", readings.filter((r) => r.use === "exam").flatMap(readingLines));
  section("Exam — listening scripts / Thi — bài nghe", clips.filter((c) => c.use === "exam").map(clipLine));
  section("Readings / Bài đọc", readings.filter((r) => r.use !== "exam").flatMap(readingLines));
  section("Listening scripts / Bài nghe (connected speech)", clips.filter((c) => c.use !== "exam" && connected(c)).map(clipLine));
  section(
    "Conversation partner lines / Lời của bạn hội thoại",
    scenarios.map((s) => `- [ ] \`${s.id}\` — ${Object.values(s.nodes).filter((n) => (n.kind === "partner" || n.kind === "terminal") && n.text).map((n) => n.text).join(" / ")}`)
  );
  section("Writing model answers / Bài viết mẫu", writing.filter((w) => w.modelAnswers?.length).map((w) => `- [ ] \`${w.id}\` — ${w.modelAnswers!.map(oneLine).join(" / ")}`));
  section("Speaking targets / Câu nói mẫu", speech.filter((s) => words(s.target) >= 3).map((s) => `- [ ] \`${s.id}\` — ${s.target}`));
  return out.join("\n");
}

export function lineCount(md: string): number {
  return md.split("\n").length;
}
