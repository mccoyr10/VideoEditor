import type { Track } from "../model/types";

/**
 * Removes a clip from a track, leaving a gap rather than rippling
 * subsequent clips' startSec — clips carry absolute timeline positions,
 * and once other tracks exist, deleting one track's clip must never shift
 * clips on another track.
 *
 * Clears the transition fields on the clips that were adjacent to the
 * deleted one, since their neighbor relationship no longer holds.
 */
export function deleteClip(track: Track, clipId: string): Track {
  const sorted = [...track.clips].sort((a, b) => a.startSec - b.startSec);
  const index = sorted.findIndex((c) => c.id === clipId);
  if (index === -1) return track;

  const prev = sorted[index - 1];
  const next = sorted[index + 1];

  const clips = sorted
    .filter((c) => c.id !== clipId)
    .map((c) => {
      if (prev && c.id === prev.id) return { ...c, transitionOut: undefined };
      if (next && c.id === next.id) return { ...c, transitionIn: undefined };
      return c;
    });

  return { ...track, clips };
}
