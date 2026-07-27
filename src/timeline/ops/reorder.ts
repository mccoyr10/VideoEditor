import type { Track } from "../model/types";
import { clearNeighborTransitions } from "./transitionCleanup";

/**
 * Moves a clip to a new position on the same track, clamped to a
 * non-negative startSec, and keeps clips sorted by startSec. Clears the
 * clip's own transition fields and its old neighbors' matching fields,
 * since a reposition breaks whatever adjacency a transition depended on.
 */
export function moveClipWithinTrack(
  track: Track,
  clipId: string,
  newStartSec: number,
): Track {
  const startSec = Math.max(0, newStartSec);
  const cleared = clearNeighborTransitions(track, clipId);

  const clips = cleared.clips
    .map((clip) =>
      clip.id === clipId
        ? { ...clip, startSec, transitionIn: undefined, transitionOut: undefined }
        : clip,
    )
    .sort((a, b) => a.startSec - b.startSec);

  return { ...cleared, clips };
}

/**
 * Moves a clip from one track to a different track at a new position.
 * Track-kind compatibility is the caller's responsibility (enforced in
 * the store), not this op's. Returns null if the clip isn't on sourceTrack.
 * Clears the clip's own transition fields (transitions are same-track
 * only) and its old neighbors' matching fields on the source track.
 */
export function moveClipToTrack(
  sourceTrack: Track,
  targetTrack: Track,
  clipId: string,
  newStartSec: number,
): { sourceTrack: Track; targetTrack: Track } | null {
  const clip = sourceTrack.clips.find((c) => c.id === clipId);
  if (!clip) return null;

  const clearedSource = clearNeighborTransitions(sourceTrack, clipId);

  const movedClip = {
    ...clip,
    trackId: targetTrack.id,
    startSec: Math.max(0, newStartSec),
    transitionIn: undefined,
    transitionOut: undefined,
  };

  return {
    sourceTrack: {
      ...clearedSource,
      clips: clearedSource.clips.filter((c) => c.id !== clipId),
    },
    targetTrack: {
      ...targetTrack,
      clips: [...targetTrack.clips, movedClip].sort(
        (a, b) => a.startSec - b.startSec,
      ),
    },
  };
}
