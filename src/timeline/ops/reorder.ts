import type { Track } from "../model/types";

/**
 * Moves a clip to a new position on the same track, clamped to a
 * non-negative startSec, and keeps clips sorted by startSec.
 */
export function moveClipWithinTrack(
  track: Track,
  clipId: string,
  newStartSec: number,
): Track {
  const startSec = Math.max(0, newStartSec);

  const clips = track.clips
    .map((clip) => (clip.id === clipId ? { ...clip, startSec } : clip))
    .sort((a, b) => a.startSec - b.startSec);

  return { ...track, clips };
}

/**
 * Moves a clip from one track to a different track at a new position.
 * Track-kind compatibility is the caller's responsibility (enforced in
 * the store), not this op's. Returns null if the clip isn't on sourceTrack.
 */
export function moveClipToTrack(
  sourceTrack: Track,
  targetTrack: Track,
  clipId: string,
  newStartSec: number,
): { sourceTrack: Track; targetTrack: Track } | null {
  const clip = sourceTrack.clips.find((c) => c.id === clipId);
  if (!clip) return null;

  const movedClip = {
    ...clip,
    trackId: targetTrack.id,
    startSec: Math.max(0, newStartSec),
  };

  return {
    sourceTrack: {
      ...sourceTrack,
      clips: sourceTrack.clips.filter((c) => c.id !== clipId),
    },
    targetTrack: {
      ...targetTrack,
      clips: [...targetTrack.clips, movedClip].sort(
        (a, b) => a.startSec - b.startSec,
      ),
    },
  };
}
