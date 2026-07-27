import { clipEndSec, type Clip, type Project, type Track } from "./types";

/** The clip on this track whose [startSec, clipEndSec) contains sec, if any. */
export function activeClipAt(track: Track, sec: number): Clip | null {
  return (
    track.clips.find((clip) => sec >= clip.startSec && sec < clipEndSec(clip)) ??
    null
  );
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
