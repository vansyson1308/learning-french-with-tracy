/**
 * Streaming readers for the ETL (P3a). The kaikki dumps are 0.2–3.3 GB
 * JSONL files that never fit in memory and never reach the repository:
 * they are streamed line by line from disk (the acquisition step downloads
 * them next to each other in a scratch directory) and discarded.
 */

import { createHash } from "crypto";
import { createReadStream, statSync } from "fs";
import { createInterface } from "readline";

/** Iterate the lines of a (possibly huge) UTF-8 text file without loading it. */
export async function* readLines(path: string): AsyncGenerator<string> {
  const stream = createReadStream(path, { encoding: "utf8", highWaterMark: 1 << 20 });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of lines) yield line;
}

/** Iterate parsed JSON objects of a JSONL file; malformed lines are counted, never thrown. */
export async function* readJsonl<T = unknown>(
  path: string,
  onBadLine?: (lineNumber: number) => void
): AsyncGenerator<T> {
  let n = 0;
  for await (const line of readLines(path)) {
    n += 1;
    if (line.trim() === "") continue;
    try {
      yield JSON.parse(line) as T;
    } catch {
      onBadLine?.(n);
    }
  }
}

/** SHA-256 and byte size of a file, streamed. */
export async function fileIdentity(path: string): Promise<{ sha256: string; bytes: number }> {
  const hash = createHash("sha256");
  const bytes = statSync(path).size;
  await new Promise<void>((resolve, reject) => {
    createReadStream(path)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve())
      .on("error", reject);
  });
  return { sha256: hash.digest("hex"), bytes };
}
