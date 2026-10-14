/**
 * Deterministic test tone (P1c): the synthetic test language's listening
 * clips are 0.5 s sine-wave WAVs generated here (8 kHz, 8-bit mono) — no
 * voice, no network, no licence, a few kilobytes. Committed under
 * assets/audio/xx-reception/<assetKey>.wav by `bun scripts/test-tone.ts`
 * and byte-checked by the reception validator for test-only targets, so
 * the file can never drift from its generator.
 */

export const TEST_TONE_SAMPLE_RATE = 8000;
export const TEST_TONE_SECONDS = 0.5;
export const TEST_TONE_HZ = 440;

/** A RIFF/WAVE PCM-8 mono file of a pure sine tone. */
export function generateToneWav(
  seconds = TEST_TONE_SECONDS,
  hz = TEST_TONE_HZ,
  sampleRate = TEST_TONE_SAMPLE_RATE
): Uint8Array {
  const samples = Math.round(seconds * sampleRate);
  const dataBytes = samples; // 8-bit mono: one byte per sample
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate (8-bit mono)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples; i++) {
    // Gentle amplitude with a 20 ms fade at both ends (no clicks).
    const fade = Math.min(1, i / (0.02 * sampleRate), (samples - 1 - i) / (0.02 * sampleRate));
    const value = Math.sin((2 * Math.PI * hz * i) / sampleRate) * 0.6 * fade;
    view.setUint8(44 + i, Math.round(128 + value * 127));
  }
  return new Uint8Array(buffer);
}
