import { clipEndSec, type Clip, type Project, type Track } from "./types";

/** The clip on this track whose [startSec, clipEndSec) contains sec, if any. */
export function activeClipAt(track: Track, sec: number): Clip | null {
  return (
    track.clips.find((clip) => sec >= clip.startSec && sec < clipEndSec(clip)) ??
    null
  );
}

export interface TrackFrame {
  clip: Clip;
  /** 1 unless blending into a transition, then fades toward 0. */
  weight: number;
  /** Present only during a crossfade's overlap window. */
  next?: { clip: Clip; weight: number };
}

/**
 * Like activeClipAt, but transition-aware: during a clip's transitionOut
 * overlap window, also resolves the next clip and a 0-1 blend weight for
 * each (weight sums to 1 across clip/next), for preview compositing.
 */
export function activeTrackFrame(track: Track, sec: number): TrackFrame | null {
  const sorted = [...track.clips].sort((a, b) => a.startSec - b.startSec);
  const index = sorted.findIndex(
    (c) => sec >= c.startSec && sec < clipEndSec(c),
  );
  if (index === -1) return null;

  const clip = sorted[index];
  const transition = clip.transitionOut;
  const next = sorted[index + 1];

  if (transition && next) {
    const overlapStart = clipEndSec(clip) - transition.durationSec;
    if (sec >= overlapStart) {
      const blend = Math.min(
        1,
        Math.max(0, (sec - overlapStart) / transition.durationSec),
      );
      return { clip, weight: 1 - blend, next: { clip: next, weight: blend } };
    }
  }

  return { clip, weight: 1 };
}

export function totalDurationSec(project: Project): number {
  let max = 0;
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      max = Math.max(max, clipEndSec(clip));
    }
  }
  return max;
}

export function allClips(project: Project) {
  return project.tracks.flatMap((track) => track.clips);
}
