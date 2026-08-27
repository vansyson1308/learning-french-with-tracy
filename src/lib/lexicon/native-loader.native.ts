/**
 * Native-only loader for the prebuilt lexicon database (metro resolves
 * this file on iOS/Android; web gets the inert ./native-loader stub, so
 * expo-sqlite and the .db asset never enter the web bundle).
 *
 * Everything here is lazy (§ startup rule: no app-wide SQLite wait, and
 * non-French users never pay for this) and fail-soft: ANY error — missing
 * native module (e.g. under jest), copy failure, corrupted file, hash
 * mismatch — resolves to null and the caller stays on the generated
 * repository. Core learning never depends on this path.
 *
 * Stale-asset rule: the filename embeds the content hash, so a new content
 * version copies a NEW file instead of overwriting; old fr-lexicon-*.db
 * files in the SQLite directory are best-effort deleted after a successful
 * open.
 */

import { NativeSqliteLexiconRepository } from "./native-repository";
import type { LexiconRepository } from "./types";

export async function loadNativeLexiconRepository(): Promise<LexiconRepository | null> {
  try {
    const [sqlite, assetMod, expoAsset, fsLegacy] = await Promise.all([
      import("expo-sqlite"),
      import("../../content/lexicon/db-asset"),
      import("expo-asset"),
      import("expo-file-system/legacy"),
    ]);
    const { FR_LEXICON_DB_NAME, FR_LEXICON_DB_ASSET, FR_LEXICON_CONTENT_HASH } = assetMod;

    const docDir = fsLegacy.documentDirectory;
    if (!docDir) return null;
    const sqliteDir = `${docDir}SQLite`;
    const target = `${sqliteDir}/${FR_LEXICON_DB_NAME}`;

    const dirInfo = await fsLegacy.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await fsLegacy.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }
    const fileInfo = await fsLegacy.getInfoAsync(target);
    if (!fileInfo.exists) {
      const asset = expoAsset.Asset.fromModule(FR_LEXICON_DB_ASSET);
      await asset.downloadAsync();
      if (!asset.localUri) return null;
      await fsLegacy.copyAsync({ from: asset.localUri, to: target });
    }

    const db = await sqlite.openDatabaseAsync(FR_LEXICON_DB_NAME);
    // Sanity: the copied file must be THIS build's content (defends against
    // a corrupted or foreign file under the expected name).
    const meta = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM metadata WHERE key = ?",
      ["contentHash"]
    );
    if (meta?.value !== FR_LEXICON_CONTENT_HASH) {
      await db.closeAsync();
      return null;
    }

    // Best-effort cleanup of stale content versions from earlier app builds.
    try {
      const entries = await fsLegacy.readDirectoryAsync(sqliteDir);
      for (const name of entries) {
        if (name.startsWith("fr-lexicon-") && name.endsWith(".db") && name !== FR_LEXICON_DB_NAME) {
          await fsLegacy.deleteAsync(`${sqliteDir}/${name}`, { idempotent: true });
        }
      }
    } catch {
      // cleanup is hygiene, never a failure
    }

    return new NativeSqliteLexiconRepository(db);
  } catch {
    return null;
  }
}
