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
