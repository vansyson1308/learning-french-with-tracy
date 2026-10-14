# Golden tests — what is pinned, how to re-bless, when that is legitimate

The goldens exist so that the Phase 1 refactors (P1b course profiles, P1c
schema/compiler generalisation, P1d persistence v4) can be **proven** not to
change anything a French learner sees. They are the executable form of the
rule "French stays byte-identical unless a milestone says otherwise".

## Two layers

| Layer | Where | What it pins |
|---|---|---|
| **Compile goldens** | `scripts/__tests__/golden/compile-manifest.json` + `compile-golden.test.ts` | sha256 of every file under `src/content/**`, every `content/reports/*.json`, `ATTRIBUTIONS.md`, and the **logical dump** of `assets/lexicon/*.db`. The test checks the committed files *and* a fresh in-memory recompile (`scripts/lib/compile-artifacts.ts`) against the manifest. |
| **Runtime goldens** | `src/lib/__tests__/golden/*.golden.test.ts` + `snapshots/*.json` | deterministic outputs of the French engine: every route's `SessionDefinition` and a scripted reducer trace; the TODAY composer for 3 personas × 3 presets × speak/silent; evidence → FSRS cards + review log; objective states, the A1 estimate, checkpoint scoring and a placement run; lexicon index/search/repository views; a grading table over every exercise type; every persona migrated, exported and re-imported. |

Determinism rules: fixed instants (`NOW_MS = 2026-06-15T12:00Z`), a fixed
seed day (`GOLDEN_DAY`), seeded RNG only, no `Date.now()` and no local-day
strings — the suites run in all five CI timezones (`checks (TZ)` matrix).
Snapshots are written with sorted keys so a diff shows the real change.

## Running

```bash
bun run test                      # includes both golden layers
bun scripts/golden.ts --check     # compile manifest + fresh recompile + runtime suites
```

A failure prints the first differing line and the file to look at.

## Re-blessing (deliberate, logged)

```bash
bun scripts/golden.ts --update --reason "P1c: compiler emits <lang>-namespaced ids for the new xx-en dummy course; fr artifacts unchanged (verified by diff)"
```

`--reason` is mandatory. The command refreshes the compile manifest from the
committed artifacts (refusing if they are stale — run `bun run
content:compile` first), rewrites every runtime snapshot with
`GOLDEN_UPDATE=1`, and appends the date, the reason and the list of changed
goldens to `scripts/__tests__/golden/CHANGELOG.md`. Commit the manifest,
the snapshots and the CHANGELOG together with the change that caused them.

Re-blessing is legitimate only when:

1. a milestone prompt explicitly changes French content or behaviour
   (new lessons, a fixed typo, a new assessment item), or
2. the change is a provably non-behavioural serialisation change (e.g. a
   new optional field that is `undefined` for French and therefore absent
   from the snapshot — in that case the snapshot should not change at all),
   or
3. a golden itself was wrong (its script or fixture), in which case the
   reason says so and the test is fixed in the same commit.

It is **never** legitimate to re-bless in order to make a refactor pass.
If a P1b–P1d change alters a French snapshot, the refactor has a bug.

## Adding a golden

Call `expectGolden("<area>/<name>", value)` from `./helpers`, run the
suite once with `GOLDEN_UPDATE=1` (or the `--update` command), review the
new snapshot by eye, and commit it with a CHANGELOG line. Keep values
free of timestamps taken from the clock, random ids and absolute paths.
