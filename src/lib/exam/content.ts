/**
 * Compiled exam tracks of a course (P3d), from the per-course artifact
 * module (`<root>/exam/<prefix>-exam-tracks.json`). Empty for courses
 * without the capability.
 */

import { artifactsFor, memoByCourse } from "../content-registry";

import type { CompiledExamTrack } from "./engine";

type ExamTracksArtifact = { version: number; language: string; tracks: CompiledExamTrack[] };

const tracksOf = memoByCourse<CompiledExamTrack[]>(
  (courseId) => (artifactsFor(courseId).examTracks as ExamTracksArtifact | undefined)?.tracks ?? []
);

export function examTracksFor(courseId: string): readonly CompiledExamTrack[] {
  return tracksOf(courseId);
}

export function examTrackFor(courseId: string, trackId: string): CompiledExamTrack | undefined {
  return tracksOf(courseId).find((t) => t.id === trackId);
}
