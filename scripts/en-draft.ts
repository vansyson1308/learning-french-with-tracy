/**
 * en-vi while it had no lessons (P4f): the same two commands as scripts/course-draft.ts with --target en, kept so
 * content/en/_drafts/_generators/en-pipeline.sh runs unchanged.
 *
 *   bun scripts/en-draft.ts syllabus    derive content/en/lexicon/syllabus.json from content/en/_drafts/pack.json
 *   bun scripts/en-draft.ts validate    validateAllSources with the staged layer, one stub exercise in each empty
 *                                       lesson, grouped by kind of error; nothing is written
 */
import { runCourseDraft } from "./course-draft";

process.exit(runCourseDraft([process.argv[2] ?? "", "--target", "en", ...process.argv.slice(3)]));
