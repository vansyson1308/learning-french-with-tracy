/**
 * Prompt bundles (P3c): `content/<target>/_drafts/<step>/PROMPT.md` +
 * `INPUT.json`. The prompt embeds the task, the blueprint slice, the
 * Vietnamese pedagogy brief of the target, the style guide, the JSON
 * schema of one record (zod → JSON Schema), the allowed id lists and 2–3
 * French exemplars (which already carry Vietnamese text since P2b). Claude
 * answers with OUTPUT.jsonl in the same folder; `ingest` validates it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { z } from "zod";

import { readJson, safeResolve } from "../pipeline";

import { stepDef, type StepId } from "./steps";

export type AllowedIds = {
  lexemes: { id: string; surface: string; gloss: string | null; partOfSpeech: string; topic?: string }[];
  objectives: string[];
  clips: string[];
  readings: string[];
  speechItems: string[];
  writingTasks: string[];
  scenarios: string[];
  lessons: string[];
  concepts: string[];
  paradigmCells: readonly string[];
  exerciseTypes: string[];
};

function ids(rel: string, key: string): string[] {
  if (!existsSync(safeResolve(rel))) return [];
  return (((readJson(rel) as Record<string, unknown>)[key] as { id: string }[]) ?? []).map((x) => x.id);
}

export function allowedIds(lang: string, native: string, courseId: string): AllowedIds {
  const lexRel = `content/${lang}/lexicon/lexemes.json`;
  const lexemes = existsSync(safeResolve(lexRel))
    ? ((readJson(lexRel) as { lexemes: { id: string; surface: string; glosses: Record<string, string>; partOfSpeech: string; topic?: string }[] }).lexemes ?? []).map((l) => ({ id: l.id, surface: l.surface, gloss: l.glosses[native] && !/^TODO:/.test(l.glosses[native]) ? l.glosses[native] : null, partOfSpeech: l.partOfSpeech, topic: l.topic }))
    : [];
  const draftPack = `content/${lang}/_drafts/pack.json`;
  const packRel = existsSync(safeResolve(draftPack)) ? draftPack : `content/courses/${courseId}.json`;
  const lessons = existsSync(safeResolve(packRel))
    ? ((readJson(packRel) as { sections: { units: { lessons: { id: string }[] }[] }[] }).sections ?? []).flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => l.id)))
    : [];
  return {
    lexemes,
    objectives: ids(`content/${lang}/assessment/objectives.json`, "objectives"),
    clips: ids(`content/${lang}/reception/listening.json`, "clips"),
    readings: ids(`content/${lang}/reception/reading.json`, "readings"),
    speechItems: ids(`content/${lang}/speech/items.json`, "items"),
    writingTasks: ids(`content/${lang}/writing/tasks.json`, "tasks"),
    scenarios: ids(`content/${lang}/interaction/scenarios.json`, "scenarios"),
    lessons,
    concepts: ids(`content/${lang}/pedagogy/concepts.json`, "concepts"),
    paradigmCells: [],
    exerciseTypes: ["select", "typeAnswer", "wordBank", "fillBlank", "match", "articleSelect", "conjugationCloze", "listeningComprehension", "readingComprehension", "dictation", "speakRepetition", "speakProduction", "guidedWriting", "simpleForm", "interactionScenario"],
  };
}

/** The blueprint sections a step needs, sliced by heading. */
export function blueprintSlice(headings: string[]): string {
  const rel = "plan/authoring/BLUEPRINT.md";
  if (!existsSync(safeResolve(rel))) return "";
  const text = readFileSync(safeResolve(rel), "utf8");
  const out: string[] = [];
  for (const h of headings) {
    const start = text.indexOf(h);
    if (start < 0) continue;
    const next = text.indexOf("\n## ", start + h.length);
    out.push(text.slice(start, next < 0 ? undefined : next).trim());
  }
  return out.join("\n\n");
}

function readOptional(rel: string): string {
  return existsSync(safeResolve(rel)) ? readFileSync(safeResolve(rel), "utf8") : "";
}

export type Bundle = { promptPath: string; inputPath: string; promptMd: string; input: Record<string, unknown> };

export function buildBundle(step: StepId, lang: string, native: string, courseId: string): Bundle {
  const def = stepDef(step);
  const schema = def.recordSchema(lang, native);
  const jsonSchema = z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any" });
  const allowed = allowedIds(lang, native, courseId);
  const brief = readOptional(`plan/authoring/briefs/${lang}-${native}.md`);
  const style = readOptional(`plan/authoring/STYLE-${native}.md`);
  const exemplars = def.exemplars();
  const dir = `content/${lang}/_drafts/${step}`;
  const input = {
    step,
    target: lang,
    native,
    courseId,
    generator: "scripts/author.ts",
    task: def.task,
    sessions: def.sessions,
    recordSchema: jsonSchema,
    allowedIds: allowed,
    exemplars,
    blueprint: blueprintSlice(def.blueprintSections),
    outputFile: `${dir}/OUTPUT.jsonl`,
  };
  const promptMd = [
    `# ${step} — ${courseId} (ngôn ngữ đích ${lang}, ngôn ngữ mẹ đẻ ${native})`,
    "",
    "Bạn là tác giả nội dung của một ứng dụng học ngoại ngữ cục bộ cho người Việt. Mọi chữ người học nhìn thấy viết bằng tiếng Việt theo STYLE; ngôn ngữ đích viết đúng chính tả bản ngữ. Đầu ra là **một tệp JSONL**: mỗi dòng một record JSON hợp lệ theo schema dưới đây, không có văn bản nào khác. Không bịa id: chỉ dùng id trong `INPUT.json → allowedIds`. Không chép câu mô tả CEFR. Bản nháp này sẽ được validator kiểm tra tự động và người bản ngữ duyệt trước khi biên dịch.",
    "",
    "## Nhiệm vụ",
    "",
    def.task,
    "",
    `Số phiên dự kiến cho một khoá đầy đủ: ${def.sessions}. Ghi kết quả vào \`${dir}/OUTPUT.jsonl\` rồi chạy \`bun scripts/author.ts ingest ${step} --target ${lang} --native ${native}\`; sửa đúng những dòng mà \`REPORT.md\` báo lỗi và chạy lại.`,
    "",
    "## Khuôn mẫu (blueprint)",
    "",
    input.blueprint || "(không có lát cắt blueprint cho bước này)",
    "",
    "## Brief sư phạm cho người Việt",
    "",
    brief || `(chưa có plan/authoring/briefs/${lang}-${native}.md)`,
    "",
    "## Văn phong",
    "",
    style || `(chưa có plan/authoring/STYLE-${native}.md)`,
    "",
    "## Schema của MỘT record (JSON Schema, sinh từ zod)",
    "",
    "```json",
    JSON.stringify(jsonSchema, null, 2),
    "```",
    "",
    "## Id cho phép",
    "",
    `Xem \`INPUT.json → allowedIds\`: ${allowed.lexemes.length} lexeme, ${allowed.objectives.length} objective, ${allowed.clips.length} clip, ${allowed.readings.length} reading, ${allowed.speechItems.length} speech item, ${allowed.writingTasks.length} writing task, ${allowed.scenarios.length} scenario, ${allowed.lessons.length} lesson, ${allowed.concepts.length} concept. Loại bài tập: ${allowed.exerciseTypes.join(", ")}.`,
    "",
    "## Ví dụ mẫu (tiếng Pháp, đã có tiếng Việt)",
    "",
    "```json",
    JSON.stringify(exemplars, null, 2),
    "```",
    "",
    "## Định dạng đầu ra",
    "",
    "- Một record mỗi dòng (JSONL), UTF-8, không dấu phẩy cuối, không bình luận.",
    "- Mọi trường tiếng Việt không chứa `TODO:`; mọi id lấy từ allowedIds.",
    "- Khi không chắc một sự kiện ngôn ngữ, viết 'thường' thay vì 'luôn luôn' và ghi `note`.",
    "",
  ].join("\n");
  return { promptPath: `${dir}/PROMPT.md`, inputPath: `${dir}/INPUT.json`, promptMd, input };
}

export function writeBundle(b: Bundle): void {
  mkdirSync(safeResolve(b.promptPath, ".."), { recursive: true });
  writeFileSync(safeResolve(b.promptPath), b.promptMd);
  writeFileSync(safeResolve(b.inputPath), `${JSON.stringify(b.input, null, 2)}\n`);
}
