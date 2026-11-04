/**
 * Local Windows builds only: cap how many fs.promises.readFile calls are in
 * flight at once. Metro's asset serializer reads every asset with one
 * Promise.all; with more than ~8,192 assets (9,248 at main 733552b) Node on
 * Windows hits its file-handle ceiling and the release bundle fails with
 * "EMFILE: too many open files". Linux CI is not affected.
 *
 * Loaded only through scripts/lib/fs-read-limit-preload.cjs, which the local
 * build scripts (plan/scripts/build-play-aab.sh, build-phone-apk.sh) put in
 * NODE_OPTIONS. It changes read scheduling only, never what is read, so the
 * bundle bytes are the same.
 */
"use strict";

/**
 * Wrap `target.readFile` so at most `limit` reads run concurrently.
 * Returns the original function (for tests / uninstall).
 */
function installReadLimit(target, limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`limit must be a positive integer, got ${limit}`);
  const original = target.readFile;
  if (original.__lftLimited) return original.__lftOriginal;
  let active = 0;
  const waiting = [];
  const acquire = () => {
    if (active < limit) {
      active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => waiting.push(resolve));
  };
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };
  const limited = function limitedReadFile(...args) {
    return acquire().then(() => original.apply(target, args)).finally(release);
  };
  limited.__lftLimited = true;
  limited.__lftOriginal = original;
  target.readFile = limited;
  return original;
}

module.exports = { installReadLimit };
