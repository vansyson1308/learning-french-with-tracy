/**
 * The SRS evidence contract (§O2b of the approved plan).
 *
 * Principle: a scheduler write represents a genuine retrieval assessment,
 * not mere exposure. UI components never call the scheduler; the only path
 * is Exercise → ReviewEvidence → evidence gate → scheduler port. The role
 * is assigned by the session composer / eligibility rules — never by the
 * component that happened to render the exercise.
 */

import type { CardKey } from "./card-key";

export type SrsRole =
  /** Exposure only (teach cards, answer reveals) — never mutates. */
  | "teach"
  /** Reinforcement (retries, mixed re-tests) — logged, never scheduled. */
  | "practice"
  /** The card's one designated retrieval probe this session. */
  | "assessment"
  /** Game mechanics (matching finale) — logged, never scheduled. */
  | "none";

export type Modality =
  | "recognizeText" // select: target → native
  | "produceText" // select: native → target, typeAnswer
  | "listen" // select listen mode
  | "arrange" // wordBank
  | "match"; // matching pairs

export type ReviewEvidence = {
  cardKey: CardKey;
  sessionId: string;
  exerciseId: string;
  modality: Modality;
  srsRole: SrsRole;
  correct: boolean;
  /** Any hint requested before answering. */
  hinted: boolean;
  /** Answer reveal or other heavy cueing — disqualifies assessment. */
  assisted: boolean;
  /** Typo/accent tolerance consumed on an accepted answer. */
  toleranceUsed: boolean;
  /** Recorded from day one; does NOT auto-derive Easy until validated. */
  latencyMs: number;
  /** 0 = first encounter this session, 1+ = retries. */
  attemptIndex: number;
};
