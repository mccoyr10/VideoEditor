import { nanoid } from "nanoid";
import type { Clip, Project, SourceId, Track, TrackKind } from "./types";

export function createTrack(kind: TrackKind, index: number): Track {
  return { id: nanoid(), kind, index, clips: [] };
}

export function createClip(params: {
  sourceId: SourceId;
  trackId: string;
  startSec: number;
  inPointSec: number;
  outPointSec: number;
}): Clip {
  return {
    id: nanoid(),
    sourceId: params.sourceId,
    trackId: params.trackId,
    startSec: params.startSec,
    inPointSec: params.inPointSec,
    outPointSec: params.outPointSec,
  };
}

export function createProject(name: string): Project {
  return {
    id: nanoid(),
    name,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    tracks: [createTrack("video", 0)],
  };
}
