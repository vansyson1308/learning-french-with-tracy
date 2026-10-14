# How to run the roadmap with Claude Code

**Autonomous mode (default):** paste `00-MASTER-PROMPT.md` once into Claude Code desktop (folder `C:\Users\MSI\Documents\app hoc ngoai ngu`). The agent runs milestones in order, stops only for owner actions, and resumes on "tiếp tục". `plan/STATUS.md` is the state; `plan/reports/<milestone>.md` holds each REPORT block.

**Manual mode (one milestone at a time), protocol owner ↔ coordinator ↔ Claude Code:**
1. The coordinator (Claude in the chat) says which prompt is next. Prompts are sequential inside a phase unless marked ∥.
2. Owner opens a terminal in the repo (`C:\src\lft`), runs `claude`, and pastes the whole prompt file (or: `claude "$(Get-Content plan/prompts/P0-local-apk-windows.md -Raw)"`).
3. Claude Code works on branch `phase-N/<milestone>`, runs the gates, updates `plan/STATUS.md`, and ends with the **report block** below.
4. Owner pastes the report block back to the coordinator; the coordinator checks the Definition of Done, asks for fixes or issues the next prompt.
5. Anything the owner must do by hand (phone packets, secrets, accounts, keystore backup) is listed by Claude Code under "Owner actions"; the coordinator tracks them.

Report block every session must end with:
```
## REPORT <milestone id>
Branch / PR: …
Changed: (bullet list, by area)
Gates: typecheck ✅/❌ · lint · bun test (5 TZ) · jest · content:check · audio:check · release:identity · web export+e2e · golden
Device: what was actually observed (or "not run")
Docs updated: …
Open questions / risks: …
Owner actions: …
Next: (what the next prompt should assume)
```

Every prompt starts with the same preamble (keep it when editing prompts):
> Read `CLAUDE.md`, then `plan/01-TONG-QUAN-VA-QUYET-DINH.md`, `plan/07-PRODUCT-SPEC.md`, `plan/08-ROADMAP.md`, and the audit sections named below. Create a task list before coding. Work on the named branch. Do not touch French behaviour unless told. End with the REPORT block from `plan/prompts/README.md`.

Prompt index:
| id | file | phase |
|---|---|---|
| MASTER | `00-MASTER-PROMPT.md` | driver for all |
| P0 | `P0-local-apk-windows.md` | 0 — APK now |
| P1a | `P1a-golden-tests.md` | 1 — engine |
| P1b | `P1b-course-profile-decouple.md` | 1 |
| P1c | `P1c-schema-and-compiler-generalise.md` | 1 |
| P1d | `P1d-persistence-v4.md` | 1 |
| P2a | `P2a-i18n-vietnamese-ui.md` | 2 — Vietnamese |
| P2b | `P2b-native-language-content-fr-vi.md` | 2 |
| P3a | `P3a-lexicon-etl-v2.md` | 3 — pipeline + en-vi |
| P3b | `P3b-audio-pipeline-v2.md` | 3 |
| P3c | `P3c-authoring-toolkit.md` | 3 |
| P3d | `P3d-author-course-vi.md` (template; run for es, then de/it/pt) | 3–4 |
| P4a | `P4a-fix-inherited-courses.md` | 4 — CJK + exams |
| P4b | `P4b-cjk-language-plugins.md` | 4 |
| P4c | `P4c-ja-vi-jlpt-n5.md` | 4 |
| P4d | `P4d-zh-vi-hsk.md` | 4 |
| P4e | `P4e-ko-vi-topik.md` | 4 |
| P4f | `P4f-en-vi-vstep.md` (recommended addition) | 4 |
| P5a–f | `P5a-fsrs-visible.md` … `P5f-constrained-llm.md` | 5 — breakthrough |
| P6a | `P6a-brand-store-prep.md` | 6 — release |
| P6b | `P6b-device-acceptance-final.md` | 6 |
