# P5f — Optional constrained LLM: on-device pack and/or BYO key (opt-in)

Read `CLAUDE.md`, **`plan/02-AUDIT-ARCHITECTURE.md` §8**, `plan/05-RESEARCH-MARKET.md` §3.4, §4.1, §4.10, `plan/06-RESEARCH-OPEN-RESOURCES.md` §4, `src/lib/tutor/*`, `src/lib/__tests__/tutor-seam.test.ts`, `release/PRIVACY_POLICY.md`, `release/DATA_SAFETY.md`. Branch `phase-5/tutor`. End with the REPORT block.

## Non-negotiables (keep the existing seam test; extend it)
Off by default; explicit opt-in screen per provider with plain Vietnamese/English explanation of what leaves the device (BYO) or what is downloaded (on-device); the tutor never imports or is imported by grading/assessment/learning/session; outputs are JSON-schema constrained (GBNF/JSON mode) against fixed taxonomies; context = current task + learner text only; nothing logged; a kill switch in Settings; privacy policy, `privacy-policy.ts`, Data safety and the README "Private" claim updated truthfully.

## Tasks
1. `TutorProvider` implementations: `OnDeviceLlamaProvider` (llama.rn or react-native-executorch; Qwen3-1.7B Q4 pack ≈1.2 GB, RAM gate ≥ 4 GB, download manager shared with P5d) and `RemoteByoKeyProvider` (OpenAI-compatible + Gemini + Anthropic endpoints; key stored with `expo-secure-store`; never in backups; timeout; no retries that resend learner text).
2. Tasks: (a) explain a detected mistake in Vietnamese (input: sentence + errorTags from P5e; output: schema `{explanation_vi, example_pair}`), (b) grade guided writing *advisory only* (schema `{slotsFound[], suggestions[]}`, shown as "Gợi ý" and never as the score), (c) roleplay turn variation for scenarios (schema `{variants[3]}` constrained to the scenario's intent list and lexeme vocabulary — validated before display, else discarded).
3. UI surfaces after writing feedback, after speech result, at scenario terminal; "Tại sao?" button; visible provider badge; disabled state when no provider.
4. Evaluation harness `benchmark/tutor/` with 50 prompts per task and a rubric; results for Qwen3-1.7B and a cloud model committed as a report (no keys in repo).
5. Docs: `release/TUTOR.md` (threat model, data flow diagram, what is sent), user guide, Data safety mapping, store metadata disclosure.

## Definition of Done
Seam test extended and green; opt-in flows tested; benchmark report; feature flag default off; privacy docs consistent (tests assert the policy mentions the opt-in paths); CI green; `plan/STATUS.md`.
