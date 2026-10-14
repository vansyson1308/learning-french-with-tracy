# P5d — Pronunciation coach: on-device ASR pack + GOP scoring (first language: the one with the best open CTC models — English if `en-vi` exists, otherwise French/Spanish — then zh tones, ja pitch)

Read `CLAUDE.md`, **`plan/05-RESEARCH-MARKET.md` §3.3, §4.2–4.3** and **`plan/06-RESEARCH-OPEN-RESOURCES.md` §3**, `plan/07-PRODUCT-SPEC.md` §4.4(1), `src/lib/speech/*`, `content/fr/speech/RESEARCH.md`. Branch `phase-5/pronunciation`. This is the hardest milestone; split into sessions A (native module + model packs), B (alignment + GOP), C (pedagogy + UI). End each with the REPORT block.

## Non-negotiables
Offline; models downloaded on demand (never in the APK); Apache/MIT runtimes only (sherpa-onnx via `react-native-sherpa-onnx` or an Expo config plugin you write); transcript matching remains the fallback and the only scored path until GOP passes the benchmark gate; speech audio never persisted; scores never feed FSRS/level claims (pronunciation is coaching, not evidence) — document in `speech/RESEARCH.md`.

## Session A — runtime + packs
Expo config plugin + native module wrapping sherpa-onnx (Android arm64/armeabi-v7a, iOS later); model pack manager (download from a GitHub Release of this repo with sha256 pins, resumable, RAM/storage gate, delete); packs: en (Zipformer streaming or SenseVoice), later zh/ja/ko/vi; `SpeechRecognizerPort` gets a second adapter selectable in Settings ("Nhận dạng giọng nói: hệ thống / gói ngoại tuyến"); e2e-less device test protocol for the owner.

## Session B — alignment + GOP
Export a small CTC phone model for the first language (speechocean762 for benchmark only; training outside the repo is acceptable if the resulting model is Apache/MIT and documented with a model card); forced alignment + GOP per phone + word; calibration to 0–100 with human-rater agreement reported (target PCC ≥ 0.5 phone-level on the public subset); latency budget ≤ 500 ms on a mid-range device; a `benchmark/` folder with the evaluation script and results.

## Session C — pedagogy + UI
Vietnamese-speaker error taxonomy per target (from `plan/authoring/briefs/<target>-vi.md`; e.g. en: final consonants, /θ ð/, stress; fr: nasal vowels, /ʁ/, liaison; es: rr, b/v; zh: tones; ja: pitch, long vowels; ko: tensed consonants, batchim); tips `{vi,en}` keyed to phones; UI: waveform-free, simple per-word colour + "nghe lại giọng mẫu / so sánh" (model vs you, your audio kept in memory only); shadowing mode (play model → record → score → repeat) in Practice; anti-gaming: random cue sentences, first attempt scored; accessibility labels.

## Definition of Done
Pack install/uninstall on the owner's phone; offline recognition works for the first language's speech items; GOP benchmark report committed; feature flag default off until two devices pass; privacy policy/Data safety note for the download (a user-initiated download from GitHub is a network request — declare it); CI green; `plan/STATUS.md`.
