import type { Track } from "../model/types";

/**
 * Clears transitionOut on clipId's sorted predecessor and transitionIn on
 * its successor (does not touch clipId's own transition fields) — for use
 * before an op moves/removes clipId in a way that breaks its current
 * adjacency, mirroring the neighbor-clearing remove.ts already does for
 * deletion.
 */
export function clearNeighborTransitions(track: Track, clipId: string): Track {
  const sorted = [...track.clips].sort((a, b) => a.startSec - b.startSec);
  const index = sorted.findIndex((c) => c.id === clipId);
  if (index === -1) return track;

  const prev = sorted[index - 1];
  const next = sorted[index + 1];
  if (!prev && !next) return track;

  const clips = track.clips.map((c) => {
    if (prev && c.id === prev.id) return { ...c, transitionOut: undefined };
    if (next && c.id === next.id) return { ...c, transitionIn: undefined };
    return c;
  });
  return { ...track, clips };
}
