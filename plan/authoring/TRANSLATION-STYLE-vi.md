# Vietnamese translation style guide (native-language content, P2b)

Scope: every learner-facing string of a course whose native language is
Vietnamese (`fr-vi` first): word glosses, exercise prompts, options,
questions, translations, guidebooks, concept prose, can-do statements,
instructions, rubric slot descriptions, cue-fact labels, scenario goals and
learner prompts. Chrome strings (buttons, tabs, alerts) are NOT here — they
live in the UI catalogue (`src/lib/i18n/GLOSSARY.md`).

## Register and voice

- Northern standard Vietnamese, neutral written register. The learner is
  **bạn**; the app speaks as **mình** only where the English speaks in the
  first person about what it heard or can check.
- Short sentences. No slang, no exclamation inflation, no emoji beyond the
  ones the source carries (📣 🇫🇷 ✓ stay).
- Keep the source's honesty: "estimate", "not an exam", "never counts
  against you" translate literally (ước tính, không phải bài thi, không bao
  giờ bị tính là điểm trừ).

## Glossary (fixed renderings)

| English | Vietnamese | Note |
|---|---|---|
| noun / verb / adjective / adverb | danh từ / động từ / tính từ / trạng từ | grammar terms stay Vietnamese |
| masculine / feminine | giống đực / giống cái | never "nam/nữ" |
| article | mạo từ | definite/indefinite: xác định / không xác định |
| singular / plural | số ít / số nhiều | |
| subject / object | chủ ngữ / tân ngữ | |
| conjugation / to conjugate | chia động từ | |
| infinitive | động từ nguyên mẫu | |
| present / past participle | thì hiện tại / quá khứ phân từ | |
| passé composé / futur proche | passé composé / futur proche | French tense NAMES stay French, explained once |
| liaison / elision | nối âm / lược âm (giữ nguyên "liaison"/"élision" trong ngoặc lần đầu) | |
| cognate / false friend | từ đồng nguyên / "bạn giả" (từ dễ nhầm) | explain once, then "từ dễ nhầm" |
| greeting | lời chào | |
| the (gloss article) | omitted | "the man" → "người đàn ông" (Vietnamese has no article; never "cái/con" unless natural) |
| lesson / unit / section | bài học / chương / phần | |
| checkpoint | bài kiểm tra | |
| guidebook | sổ tay | |

## What NOT to translate

- French target text: words, sentences, model answers, accepted variants,
  form field labels (*Prénom*, *Âge*, *Ville*), clip transcripts, names of
  people and places, numbers written as digits.
- Ids, emoji, markdown structure (`##`, `-`, `**bold**`, `*italic*`):
  keep the exact markup, translate only the words.
- Placeholders are not used in content; if a string contains a French word
  in quotes or italics (*le*, *la*), keep it as is.

## Gloss conventions (word.native, lexicon glosses, match pairs, options)

- One short noun phrase, no final period, no article: "the apple" → "quả
  táo", "the water" → "nước", "the man" → "người đàn ông".
- Verbs in the infinitive sense without "to": "to eat" → "ăn".
- Keep the gloss SHORT and distinctive: four options of one exercise must
  stay distinguishable at a glance (no two options may become identical —
  the validator rejects duplicates).
- Interjections/formulas: "hello" → "xin chào", "thank you" → "cảm ơn",
  "please" → "làm ơn", "goodbye" → "tạm biệt", "good evening" → "chào buổi
  tối", "good night" → "chúc ngủ ngon".

## Sentence conventions (translations, typeAnswer answers, wordBank answers)

- Natural Vietnamese word order; do not mirror French/English order.
- `typeAnswer` (translate mode): the learner TYPES the Vietnamese sentence.
  Draft the most natural sentence as `answer`; put 1–3 acceptable variants
  (with/without "tôi", "là", classifier) under `alternatives`. Grading is
  diacritic-tolerant and case-insensitive; punctuation is ignored.
- `wordBank` (target→native): the learner ASSEMBLES the Vietnamese sentence
  from tokens. Draft `answer` as the sentence (tokens = its space-separated
  syllables/words) and `distractors` as 2–4 Vietnamese tokens that are
  plausible but wrong (another word from the same unit). Keep the answer to
  ≤ 8 tokens.
- Translations shown under a French sentence (`translation` fields): a
  faithful rendering; keep names.

## Instructions and prompts

- Imperatives address the learner directly: "Greet the baker." → "Hãy chào
  người bán bánh."; "You are Léa. Write…" → "Bạn là Léa. Hãy viết…".
- Questions end with "?" and use "gì / nào / ở đâu / khi nào / ai".
- Cue-fact labels are nouns: "Your name" → "Tên của bạn", "The time" →
  "Giờ".
- Rubric slot descriptions complete the sentence "Bạn đã nêu …": "your
  name" → "tên của bạn", "a greeting" → "lời chào".

## Guidebooks and concept prose (markdown)

- Explain French grammar to a Vietnamese reader: when English leans on an
  English contrast ("like 'the' in English"), replace it with the
  Vietnamese reality ("tiếng Việt không có mạo từ, nên hãy học mạo từ cùng
  với danh từ"). Keep every French example and its gloss.
- Headings keep their markdown level; lists keep their bullets; bold the
  French forms exactly as the source does.

## Workflow

1. `bun scripts/translate-native.ts extract --from en --to vi --target fr`
   writes `content/fr/translations/vi.jsonl` (one line per string; `vi`
   empty where a draft is missing; `note` explains structured records).
2. Draft with Claude using the prompt below, one file group at a time; paste
   the lines back (same `key`, same `en`, filled `vi`). Structured records
   (`note` present) take an object: `{"answer": "...", "distractors": [...]}`
   or `{"answer": "...", "alternatives": [...]}`.
3. `bun scripts/translate-native.ts apply --from en --to vi --target fr`
   writes the drafts into the sources, generates `content/courses/fr-vi.json`
   + `fr-vi.map.json` and the review sheet `content/fr/REVIEW-vi.md`.
   A missing or stale draft fails the command.
4. `bun run content:validate && bun run content:compile`; the French
   artifacts must stay byte-identical (`bun scripts/golden.ts --check`).
5. Native review: a Vietnamese speaker works through `REVIEW-vi.md`;
   corrections go back into the JSONL (`apply` again). Until signed off,
   `KNOWN_LIMITATIONS.md` says "pending native review".

## Prompt template for Claude

```
You are translating learner-facing strings of a French course from English
into Vietnamese for Vietnamese beginners (A1). Follow the style guide
(pasted below) exactly: northern standard, "bạn", no slang, fixed glossary,
never translate French target text, keep markdown markup, keep names and
digits. For records with a "note", answer with the JSON object the note
describes. Return the SAME JSONL lines with the "vi" field filled and
nothing else changed.

<style guide: plan/authoring/TRANSLATION-STYLE-vi.md>

<lines of content/fr/translations/vi.jsonl>
```
