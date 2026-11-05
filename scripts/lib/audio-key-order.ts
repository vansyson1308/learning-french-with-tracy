/**
 * Key order of src/content/audio-manifest.ts and its per-course slices (src/content/audio/<course>.ts).
 *
 * Both used `localeCompare`, whose Han / kana / Hangul order comes from the ICU build of the runtime: bun on
 * Windows put 累 after 红 in zh-vi, the Linux runner put it before, so a local compile drifted from the committed
 * file. The order is now fixed by the data, with no ICU in it for those scripts:
 *  - keys are grouped by course id (`<courseId>:<text>`), course ids in code-point order;
 *  - a course whose keys contain no Han / kana / Hangul keeps `localeCompare`, so French, English and the other
 *    Latin-script slices stay byte-identical (ICU agrees across platforms there);
 *  - any other course is sorted by UTF-16 code units, on every platform.
 * The mode is decided per course, never per key, so the comparison inside a course is one total order.
 */

/** Han (incl. extension A and compatibility), hiragana, katakana, Hangul syllables and jamo. */
const CJK = /[ᄀ-ᇿ぀-ヿ㄰-㆏㐀-䶿一-鿿가-힯豈-﫿]/u;

const courseOf = (key: string): string => {
  const i = key.indexOf(":");
  return i < 0 ? "" : key.slice(0, i);
};

const codePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** A sorted copy of manifest entries (input untouched). */
export function sortAudioKeys<E extends { key: string }>(entries: readonly E[]): E[] {
  const byCourse = new Map<string, E[]>();
  for (const e of entries) {
    const course = courseOf(e.key);
    const list = byCourse.get(course);
    if (list) list.push(e);
    else byCourse.set(course, [e]);
  }
  return [...byCourse.keys()].sort(codePoint).flatMap((course) => {
    const list = byCourse.get(course) ?? [];
    const compare = list.some((e) => CJK.test(e.key)) ? codePoint : (a: string, b: string) => a.localeCompare(b);
    return [...list].sort((x, y) => compare(x.key, y.key));
  });
}
