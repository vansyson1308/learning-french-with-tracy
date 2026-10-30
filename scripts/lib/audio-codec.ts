/**
 * The codec of each bundled audio layer: ONE pipeline setting,
 * content/audio/engines.json `encoding.codecByLayer` (mp3 | opus, default
 * mp3 for every layer). release/ASSET_DELIVERY.md records what flips once CI
 * has proven Opus playback (device acceptance API 30 + 34, and web).
 *
 *  - mp3: the existing recipe; asset keys, file names and bytes unchanged.
 *  - opus: Ogg Opus mono at `opusKbps` (16-20 kbps), 24 kHz (libopus has no
 *    22.05 kHz mode); the codec enters the asset key (recipe "opus-<k>k"),
 *    so an Opus asset never takes over an MP3 asset's key, and the file is
 *    `<key>.opus`.
 *
 * Only the story layer may switch for now: it is the one CI proves
 * (story-sentence fixture), and the one that pays for more stories under the
 * 88 MB cap. Pack, lexicon and listening clips stay MP3.
 */

export const AUDIO_CODECS = ["mp3", "opus"] as const;
export type AudioCodec = (typeof AUDIO_CODECS)[number];

export const CODEC_LAYERS = ["pack", "lexicon", "reception", "story"] as const;
export type CodecLayer = (typeof CODEC_LAYERS)[number];

/** Layers allowed to be set to opus (the others are MP3 until a reviewed change says otherwise). */
export const OPUS_LAYERS: readonly CodecLayer[] = ["story"];

export const OPUS_KBPS_RANGE: [number, number] = [16, 20];
/** libopus has no 22.05 kHz mode; 24 kHz keeps the whole band of the 22.05 kHz renders. */
export const OPUS_SAMPLE_RATE_HZ = 24000;

export type CodecSettings = {
  codecByLayer?: Partial<Record<CodecLayer, AudioCodec>>;
  opusKbps?: number;
  /** Languages whose bundled audio is frozen as MP3 whatever the layer setting (French: CLAUDE.md §4). */
  mp3OnlyLanguages?: string[];
};

/** The layer's codec for a language; anything unset, and every mp3-only language, is mp3. */
export function codecFor(enc: CodecSettings | undefined, layer: CodecLayer, lang?: string): AudioCodec {
  if (lang !== undefined && (enc?.mp3OnlyLanguages ?? []).includes(lang)) return "mp3";
  return enc?.codecByLayer?.[layer] ?? "mp3";
}

export function opusKbpsOf(enc: CodecSettings | undefined): number {
  return enc?.opusKbps ?? OPUS_KBPS_RANGE[0];
}

/** Problems of the setting (pure; tested). */
export function codecProblems(enc: CodecSettings | undefined): string[] {
  const problems: string[] = [];
  for (const [layer, codec] of Object.entries(enc?.codecByLayer ?? {})) {
    if (!(CODEC_LAYERS as readonly string[]).includes(layer)) problems.push(`codecByLayer: unknown layer "${layer}" (${CODEC_LAYERS.join(", ")})`);
    else if (!(AUDIO_CODECS as readonly string[]).includes(codec as string)) problems.push(`codecByLayer.${layer}: "${codec}" is not mp3 or opus`);
    else if (codec === "opus" && !OPUS_LAYERS.includes(layer as CodecLayer)) problems.push(`codecByLayer.${layer}: opus is prepared for ${OPUS_LAYERS.join(", ")} only (release/ASSET_DELIVERY.md)`);
  }
  if (!(enc?.mp3OnlyLanguages ?? []).includes("fr")) problems.push(`mp3OnlyLanguages must keep "fr": French audio stays byte-identical (CLAUDE.md §4)`);
  const kbps = enc?.opusKbps;
  if (kbps !== undefined && !(Number.isInteger(kbps) && kbps >= OPUS_KBPS_RANGE[0] && kbps <= OPUS_KBPS_RANGE[1])) problems.push(`opusKbps: ${kbps} is outside ${OPUS_KBPS_RANGE[0]}-${OPUS_KBPS_RANGE[1]}`);
  return problems;
}

export function assetExt(codec: AudioCodec | undefined): "mp3" | "opus" {
  return codec === "opus" ? "opus" : "mp3";
}

export function assetFileName(assetKey: string, codec: AudioCodec | undefined): string {
  return `${assetKey}.${assetExt(codec)}`;
}

/** Bundled audio file extensions (size budget, orphan sweeps). */
export const AUDIO_FILE_EXTS = [".mp3", ".wav", ".opus"] as const;
export const isAudioFile = (name: string) => AUDIO_FILE_EXTS.some((e) => name.endsWith(e));

/**
 * Headroom before an Opus encode: a peak limiter at -3 dBFS. The decoded
 * Opus overshoots the loudness-normalised input. In the first es run
 * (40975675021) two story sentences decoded at a 0 dB peak, which the
 * technical QA fails for new clips (-0.2 dB). MP3 encodes are unchanged.
 */
export const OPUS_PEAK_LIMIT = 0.708;
export const OPUS_LIMITER = `alimiter=limit=${OPUS_PEAK_LIMIT}:level=disabled`;

/** The asset-key recipe part of a codec: none for mp3 (keys unchanged), "opus-<k>k-lim3" for opus. */
export function codecRecipe(codec: AudioCodec, enc: CodecSettings | undefined): string | null {
  return codec === "opus" ? `opus-${opusKbpsOf(enc)}k-lim3` : null;
}

/** ffmpeg output options of the final encode (after the filter). */
export function encodeOptions(codec: AudioCodec, input: { sampleRateHz: number; channels: number; mp3Kbps: number; opusKbps: number }): string {
  if (codec === "opus") return `-ar ${OPUS_SAMPLE_RATE_HZ} -ac 1 -map_metadata -1 -codec:a libopus -b:a ${input.opusKbps}k -application voip`;
  return `-ar ${input.sampleRateHz} -ac ${input.channels} -codec:a libmp3lame -b:a ${input.mp3Kbps}k`;
}
