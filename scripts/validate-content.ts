/** CI entry: schema + rule + provenance validation of the content sources. */
import { validateContent } from "./lib/pipeline";

const { errors, warnings } = validateContent();
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("content validation passed");
