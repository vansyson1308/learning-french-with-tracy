# P3d — Author `<target>-vi` to French parity (template; first run: `es-vi`)

Use this prompt for every Latin-script course: `es-vi` (first, in Phase 3), then `de-vi`, `it-vi`, `pt-vi` (Phase 4, can run in parallel sessions). For `ja/zh/ko` use P4c–P4e, for `en` use P4f — they add the script/exam specifics on top of this template. Replace `<target>` below before pasting (e.g. `es`).

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md`, `plan/authoring/BLUEPRINT.md`, `plan/authoring/STYLE-vi.md`, **`plan/authoring/briefs/<target>-vi.md`**, `plan/03-AUDIT-CONTENT.md` §2 (the French structure), `content/<target>/lexicon/REVIEW.md`. Branch `phase-3/<target>-vi` (or `phase-4/<target>-vi`). This milestone runs as **several Claude Code sessions** (one per authoring step); `content/<target>/_drafts/<step>/REPORT.md` is the hand-off between sessions. End each session with the REPORT block, naming the next step.

## Goal
A `<target>-vi` course with every French-parity layer, **all learner-facing text in Vietnamese**, bundled audio in the target language, an honest A1 claim gate, and an exam track (DELE A1 for es, Goethe A1 for de, CILS/CELI A1 for it, CAPLE A1 for pt — formats only, never real exam items).

## Rules for Vietnamese learner-facing text (from `STYLE-vi.md`; apply everywhere)
- Giọng thân thiện, ngắn, "bạn"; thuật ngữ ngữ pháp tiếng Việt thống nhất theo `GLOSSARY.md` (danh từ, động từ, giống đực/giống cái/giống trung, mạo từ, chia động từ, thì hiện tại…); giải thích luôn so sánh với tiếng Việt khi hữu ích (vd. tiếng Việt không chia động từ, không có mạo từ, dùng đã/đang/sẽ).
- Câu "can-do" viết nguyên bản bằng tiếng Việt, không chép descriptor CEFR; câu ước tính trình độ đúng mẫu: "Ước tính theo khung CEFR — không phải kỳ thi hay chứng chỉ CEFR chính thức."
- Mọi prompt/câu hỏi/lựa chọn/phản hồi trong bài tập: tiếng Việt; từ/câu đích: ngôn ngữ đích. Không có tiếng Anh ở bất kỳ chỗ nào người học nhìn thấy.

## Steps (one session each unless small)
1. `objectives` → `content/<target>/assessment/objectives.json` (≈34–40; 5 domains; `direct`/`supports` with evidence notes; `canDo {vi}` + `{en}` optional), `claim-policy.json` (v2), `attainment.json`, `RESEARCH.md` (clean-room; cite CEFR CV 2020 by identity only).
2. `units` → Sections 1–6 plan mirroring French (Section 1 authored new, 5 units; Sections 2–6 per brief), guidebooks in Vietnamese; lexeme allocation from `content/<target>/lexemes.json` (every lexeme taught ≥2 times; topics balanced).
3. `concepts` → ≈17–20 concept cards per the brief (gender/articles, high-yield verbs, present tense paradigms, numbers, pronunciation rules, cognates with Vietnamese loanwords where real, false friends) with paradigm tables evidenced by `morphology.json`.
4. `lessons` → 27 units × 4 lessons with all 15 exercise types per blueprint; `flow` interleaving concepts in ≥ 25 lessons; wordBank/typeAnswer include **target-language production**; speech items by id.
5. `readings` + `listening` → ≥19 readings, ≈180 clips (teaching, checkpoint, speech models, ≈110 partner turns) with cast A/B from `content/audio/voice-casts.json`; canary + generate via the P3b workflow (`lang=<target> layer=all`).
6. `speech` (50 items, 22 reserved) and `writing` (34 tasks, 16 reserved) with Vietnamese instructions/cue facts; rubric slot variants.
7. `scenarios` → 18 (10 reserved) around the brief's scenario list.
8. `checkpoints` (6 section + capstone 2 forms) and `placement` (4 stages, ≤28 items).
9. `exam-track` → `content/<target>/exam/<track>.json`: level list, item banks per section mirroring the public exam format, timing, scoring, `readiness {vi}` wording ("mức sẵn sàng ước tính", never "sẽ đỗ"); the exam-track engine/UI (Exam card, section practice, timed mock with ≥2 forms, weak areas → FSRS) is built in the **first** run (`es-vi`) and reused afterwards.
10. Native review: the owner walks `REVIEW-CHECKLIST.md` (all Vietnamese strings) and the target-language content is checked by a native/advanced speaker where possible; fixes; set `review` in `content/courses/<target>-vi.profile.json`.
11. Compile, claim gate → A1 claimable; reports committed; catalog regenerated; onboarding lists the course for Vietnamese UI; the inherited `<target>-en` basic pack is removed from onboarding (kept installable under "Khoá khác" until P6 decides); device walk; RC (`bun run release:bump`, RC history).

## Definition of Done (whole milestone)
All validators + linters green; claim gate A1 = true for `<target>` with coverage for `<target>-vi`; audio provenance closed; exam-track mock runs offline; owner device walk (Packets 3–6 adapted); `docs/USER_GUIDE.vi.md` section for the course; CI green; `plan/STATUS.md` updated.
