#!/usr/bin/env bun
/**
 * Playback evidence for the device-acceptance lesson checks
 * (scripts/device/acceptance.sh). Two independent system signals:
 *
 *   - media session: the system logs each PlaybackState the app's session
 *     reports. API 33+ prints `state=PLAYING(3)`, API 30–32 `state=3`.
 *   - audio service: `dumpsys audio` keeps an event log of every player
 *     (AudioTrack, MediaPlayer, ...) — "new player piid:N uid/pid:U/P" then
 *     "player piid:N state:started" (API 30) / "event:started" (newer).
 *     Players created after the lesson started (piid above the floor taken
 *     before it) that belong to the app's uid and reached "started" count.
 *
 *   bun scripts/device/audio-evidence.ts max-piid <dumpsys.txt>
 *   bun scripts/device/audio-evidence.ts count <pkg> <uid> <piid-floor> <logcat-window.txt> <dumpsys-after.txt>
 *     → "<session plays> <audio-service starts>"
 */
import { readFileSync } from "fs";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Media-session PLAYING reports of `pkg` in a logcat window. */
export function sessionPlays(logcat: string, pkg: string): number {
  const re = new RegExp(`onPlaybackStateChanged\\(\\): ${escape(pkg)} : PlaybackState \\{state=(PLAYING\\(3\\)|3,)`);
  return logcat.split(/\r?\n/).filter((line) => re.test(line)).length;
}

/** The highest player id in a `dumpsys audio` dump (0 when none). */
export function maxPiid(dumpsys: string): number {
  let max = 0;
  for (const [, id] of dumpsys.matchAll(/\bpiid:(\d+)/g)) max = Math.max(max, Number(id));
  return max;
}

/** "started" events of the app's players created after `floor`. */
export function audioServiceStarts(dumpsys: string, uid: number, floor: number): number {
  const mine = new Set<number>();
  for (const [, id, owner] of dumpsys.matchAll(/new player piid:(\d+) uid\/pid:(\d+)\//g)) {
    if (Number(owner) === uid && Number(id) > floor) mine.add(Number(id));
  }
  let starts = 0;
  for (const [, id] of dumpsys.matchAll(/player piid:(\d+) (?:state|event):started\b/g)) {
    if (mine.has(Number(id))) starts++;
  }
  return starts;
}

if (import.meta.main) {
  const [cmd, ...args] = process.argv.slice(2);
  const read = (file: string) => readFileSync(file, "utf8");
  if (cmd === "max-piid" && args.length === 1) {
    console.log(maxPiid(read(args[0])));
  } else if (cmd === "count" && args.length === 5) {
    const [pkg, uid, floor, logcat, dumpsys] = args;
    console.log(`${sessionPlays(read(logcat), pkg)} ${audioServiceStarts(read(dumpsys), Number(uid), Number(floor))}`);
  } else {
    console.error("usage: audio-evidence.ts max-piid <dumpsys> | count <pkg> <uid> <floor> <logcat> <dumpsys>");
    process.exit(2);
  }
}
