/**
 * Message references (P2a): lib modules never produce user-facing
 * sentences; they return a catalogue key plus parameters and the UI
 * formats it in the current UI language. This file has no dependency on
 * the store or the catalogue so any engine module may import it.
 */
import type { Params } from "./format";
import type { MessageKey } from "./keys";

export type Message = { readonly key: MessageKey; readonly params?: Params };

export function msg(key: MessageKey, params?: Params): Message {
  return params ? { key, params } : { key };
}
