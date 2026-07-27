export type ClipId = string;
export type TrackId = string;
export type SourceId = string;

export type TrackKind = "video" | "audio" | "overlay";

/** The kind of imported media a clip's source is — mirrors SourceMedia["kind"] in media/mediaStore.ts. */
export type MediaKind = "video" | "audio" | "image";

export interface Track {
  id: TrackId;
  kind: TrackKind;
  index: number;
  clips: Clip[];
  muted?: boolean;
  hidden?: boolean;
}

export type TransitionType = "cut" | "crossfade" | "wipe";

export interface Transition {
  type: TransitionType;
  durationSec: number;
}

export interface Clip {
  id: ClipId;
  sourceId: SourceId;
  sourceKind: MediaKind;
  trackId: TrackId;
  /** Position on the timeline, in seconds. */
  startSec: number;
  /** Trim in-point, relative to the source media, in seconds. */
  inPointSec: number;
  /** Trim out-point, relative to the source media, in seconds. */
  outPointSec: number;
  playbackRate?: number;
  transitionIn?: Transition;
  transitionOut?: Transition;
}

export interface TextOverlayContent {
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
}

export interface TextOverlayClip extends Clip {
  content: TextOverlayContent;
}

export interface Project {
  id: string;
  name: string;
  fps: number;
  resolution: { width: number; height: number };
  tracks: Track[];
}

export function clipDurationSec(clip: Clip): number {
  return clip.outPointSec - clip.inPointSec;
}

export function clipEndSec(clip: Clip): number {
  return clip.startSec + clipDurationSec(clip);
}
