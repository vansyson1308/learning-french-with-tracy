/**
 * Scoped licences (QC 2026-11-03 §2): Unicode-3.0 and CC-BY-SA-3.0 may cover
 * data files only, OFL-1.1 font files only. A registry entry that points a
 * scoped licence at anything else fails validation, and the registry must
 * record the decision behind every scoped licence it uses (`policy`).
 */
import { SCOPED_LICENSES } from "../../content/schema";

const CODE = /\.(tsx?|jsx?|mjs|cjs|py|sh)$/i;
const CODE_DIRS = /^(src\/(lib|app|components)\/|scripts\/)/;
const FONT = /^assets\/fonts\/|\.(ttf|otf|woff2?)$/i;

export function coverFitsScope(cover: string, scope: "data" | "font"): boolean {
  if (scope === "font") return FONT.test(cover);
  return !CODE.test(cover) && !CODE_DIRS.test(cover);
}

type Source = { id: string; license: string; covers: string[] };
type Policy = { licence: string; scope: "data" | "font" };

/** Every misuse of a scoped licence (pure; tested). */
export function scopeErrors(sources: readonly Source[], policy: readonly Policy[] = []): string[] {
  const errors: string[] = [];
  for (const s of sources) {
    const scope = SCOPED_LICENSES[s.license];
    if (!scope) continue;
    for (const c of s.covers) {
      if (!coverFitsScope(c, scope)) errors.push(`registry: ${s.id}: ${s.license} may cover ${scope === "font" ? "font files" : "data files"} only, not ${c}`);
    }
    const recorded = policy.find((p) => p.licence === s.license);
    if (!recorded) errors.push(`registry: ${s.id}: ${s.license} is scoped; record the decision in the registry's policy`);
    else if (recorded.scope !== scope) errors.push(`registry: policy for ${s.license} says ${recorded.scope}, the allowlist says ${scope}`);
  }
  return errors;
}
