import { createClip } from "../model/factories";
import type { SourceId, Track } from "../model/types";

export interface InsertClipParams {
  sourceId: SourceId;
  startSec: number;
  inPointSec: number;
  outPointSec: number;
}

/**
 * Appends a new clip to a track and keeps clips sorted by startSec.
 * Overlaps are allowed (not auto-resolved) — this is a deliberate
 * simplification for the current phase.
 */
export function insertClip(track: Track, params: InsertClipParams): Track {
  const clip = createClip({
    sourceId: params.sourceId,
    trackId: track.id,
    startSec: params.startSec,
    inPointSec: params.inPointSec,
    outPointSec: params.outPointSec,
  });

  return {
    ...track,
    clips: [...track.clips, clip].sort((a, b) => a.startSec - b.startSec),
  };
}
