import { createClip } from "../model/factories";
import type { MediaKind, SourceId, Track } from "../model/types";

export interface InsertClipParams {
  sourceId: SourceId;
  sourceKind: MediaKind;
  startSec: number;
  inPointSec: number;
  outPointSec: number;
}

/**
 * Appends a new clip to a track and keeps clips sorted by startSec.
 * Overlaps are allowed (not auto-resolved) — this is a deliberate
 * simplification for the current phase. Track-kind compatibility is the
 * caller's responsibility (enforced in the store), not this op's.
 */
export function insertClip(track: Track, params: InsertClipParams): Track {
  const clip = createClip({
    sourceId: params.sourceId,
    sourceKind: params.sourceKind,
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
