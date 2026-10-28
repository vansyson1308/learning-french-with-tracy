# P-ai-review — AI-simulated native review replaces human reviewers (owner decision D-10, 2026-10-29)

Owner decision: no paid native reviewers. Content is reviewed by Claude acting as a native-speaker teacher of each language for Vietnamese learners. Target quality: clearly above "beta"; residual errors accepted by the owner. Record D-10 in `plan/01-TONG-QUAN-VA-QUYET-DINH.md`.

## Honesty (CLAUDE.md non-negotiable 3 still applies)
- Course profile: `review: {kind: "ai-simulated", reviewer: "Claude (simulated native reviewer)", date, scope, report}`. The compile gate accepts `kind: "ai-simulated"` only when `plan/OWNER-FINAL-CHECKLIST.md` records the owner's acceptance for that course.
- The app never says "đã được người bản ngữ duyệt". The "Beta" label becomes an honest note in course info + Licences screen: "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ. Nếu thấy lỗi, hãy báo cho chúng tôi." (en equivalent). `KNOWN_LIMITATIONS.md` entry per course.

## Process per course (fr-vi, es-vi, de-vi now; every later course inside its P3d)
Use a **separate reviewer agent with fresh context** (never the session that authored the content), persona: experienced native teacher of <lang> who teaches Vietnamese adults. Input: `REVIEW-TIER1-*.md` first, then everything learner-facing.
1. **Answer keys first (P0):** every exercise — is the expected answer correct, and are all other correct answers accepted (word order variants, contractions, polite/familiar forms, accent-less input rules)? A correct learner answer marked wrong is the worst error.
2. **Target-language pass:** grammar, naturalness ("would a native say this?"), register (tu/vous, du/Sie, tú/usted, Lei/tu) consistent per scenario, A1 appropriateness, standard variety per `VARIETY.md`, audio scripts pronounceable.
3. **Vietnamese pass:** translation meaning-accurate, natural Vietnamese (not translationese), `STYLE-vi.md` + `GLOSSARY.md` terms, grammar explanations correct and simple.
4. **Cross-checks:** LanguageTool hits, back-translation disagreements, distractors that are accidentally also correct.
5. Each finding: id, severity (P0 wrong answer/meaning · P1 unnatural/wrong register · P2 style), fix applied, or `uncertain` with the reason. Batch target-text fixes per language into **one** audio run.
6. **Independent audit:** a second fresh reviewer re-checks a random 10 % of the lines that passed. If it finds > 2 % P0/P1, redo that course's pass. Record counts in `content/<lang>/REVIEW-AI.md` (lines reviewed, findings by severity, audit sample + error rate, uncertain list).
7. `uncertain` items (keep them few, ideally < 20 per course) go to `OWNER-FINAL-CHECKLIST.md`; they never block work.

## Owner part (optional, non-blocking, in OWNER-FINAL-CHECKLIST)
The owner reads Vietnamese natively, French at degree level and English at C1: list fr-vi and en-vi target text and all Vietnamese text as "owner spot-check", plus the `uncertain` items.

## Gates
`fr-en` byte-identical; goldens green; validators extended for the `review.kind` field; all CI + device shards green.

## Order
Insert after the de-vi merge: run P-ai-review for fr-vi, es-vi, de-vi (one PR `phase-4/ai-review`), then continue with exam-engine-v2 → P3d(it) (with this review built into it) as in `QC-2026-10-29-de-it.md`.
