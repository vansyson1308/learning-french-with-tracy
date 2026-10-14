/**
 * Migration + backup goldens (P1a): every historical persona migrated to
 * the current persisted shape at a fixed instant, then exported as a
 * backup envelope and staged back through the import path. Persisted-shape
 * changes (P1d) must show up here and be re-blessed with a reason, next to
 * their numbered migration.
 */
import { describe, test } from "bun:test";

import { createEnvelope, runInvariants, stageImport } from "../../persistence/backup-core";
import { learnerDataFromBlob } from "../../persistence/learner";
import { PERSIST_VERSION, migrateProgress } from "../../persistence/migrations";
import { NOW, PERSONA_NAMES, expectGolden, fixtureFor } from "./helpers";

const ALL = [...PERSONA_NAMES, "v0-flat-legacy"] as const;

describe("migration + backup goldens", () => {
  for (const name of ALL) {
    test(`${name}: migrate from v${fixtureFor(name).version} → v${PERSIST_VERSION}, export, re-import`, () => {
      const fixture = fixtureFor(name);
      const migrated = migrateProgress(fixture.state, fixture.version, NOW);
      const envelope = createEnvelope(migrated, learnerDataFromBlob(migrated), PERSIST_VERSION, NOW);
      const staged = stageImport(JSON.stringify(envelope), NOW);
      expectGolden(`migrations/${name}`, {
        fromVersion: fixture.version,
        toVersion: PERSIST_VERSION,
        migrated,
        invariants: runInvariants(migrated, NOW),
        envelope: { ...envelope, state: undefined },
        staged,
      });
    });
  }

  test("every intermediate version of v0-rich (v1, v2, v3, v4)", () => {
    const fixture = fixtureFor("v0-rich");
    expectGolden(
      "migrations/v0-rich.steps",
      [1, 2, 3, 4].map((to) => ({ to, state: migrateProgress(fixtureFor("v0-rich").state, fixture.version, NOW, to) }))
    );
  });
});
