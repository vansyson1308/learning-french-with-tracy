/**
 * Native-only loader for a language's prebuilt lexicon database (metro
 * resolves this file on iOS/Android; web gets the inert ./native-loader
 * stub, so expo-sqlite and the .db assets never enter the web bundle).
 *
 * Everything here is lazy (§ startup rule: no app-wide SQLite wait, and
 * learners of courses without a lexicon never pay for this) and fail-soft:
 * ANY error — missing native module (e.g. under jest), copy failure,
 * corrupted file, hash mismatch — resolves to null and the caller stays on
 * the generated repository. Core learning never depends on this path.
 *
 * Stale-asset rule: the filename embeds the content hash, so a new content
 * version copies a NEW file instead of overwriting; old
 * `<code>-lexicon-*.db` files of THE SAME language in the SQLite directory
 * are best-effort deleted after a successful open — other languages'
 * databases are never touched (P1b).
 */

import { NativeSqliteLexiconRepository } from "./native-repository";
import type { LexiconRepository } from "./types";

export async function loadNativeLexiconRepository(
  targetCode: string,
  nativeCode: string,
  /** The course's own database key when its native language is not the target's primary one (P2b: `fr-vi`). */
  assetKey: string = targetCode
): Promise<LexiconRepository | null> {
  try {
    const [sqlite, assetMod, expoAsset, fsLegacy] = await Promise.all([
      import("expo-sqlite"),
      import("../../content/lexicon/db-assets"),
      import("expo-asset"),
      import("expo-file-system/legacy"),
    ]);
    const entry = assetMod.LEXICON_DB_ASSETS[assetKey] ?? assetMod.LEXICON_DB_ASSETS[targetCode];
    if (!entry) return null;
    const { name: dbName, contentHash, asset: assetModule } = entry;

    const docDir = fsLegacy.documentDirectory;
    if (!docDir) return null;
    const sqliteDir = `${docDir}SQLite`;
    const target = `${sqliteDir}/${dbName}`;

    const dirInfo = await fsLegacy.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await fsLegacy.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }
    const fileInfo = await fsLegacy.getInfoAsync(target);
    if (!fileInfo.exists) {
      const asset = expoAsset.Asset.fromModule(assetModule);
      await asset.downloadAsync();
      if (!asset.localUri) return null;
      await fsLegacy.copyAsync({ from: asset.localUri, to: target });
    }

    const db = await sqlite.openDatabaseAsync(dbName);
    // Sanity: the copied file must be THIS build's content (defends against
    // a corrupted or foreign file under the expected name).
    const meta = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM metadata WHERE key = ?",
      ["contentHash"]
    );
    if (meta?.value !== contentHash) {
      await db.closeAsync();
      return null;
    }

    // Best-effort cleanup of stale content versions of THIS language only.
    const prefix = `${targetCode}-lexicon-`;
    try {
      const entries = await fsLegacy.readDirectoryAsync(sqliteDir);
      for (const file of entries) {
        if (file.startsWith(prefix) && file.endsWith(".db") && file !== dbName) {
          await fsLegacy.deleteAsync(`${sqliteDir}/${file}`, { idempotent: true });
        }
      }
    } catch {
      // cleanup is hygiene, never a failure
    }

    return new NativeSqliteLexiconRepository(db, { targetCode, nativeCode });
  } catch {
    return null;
  }
}
