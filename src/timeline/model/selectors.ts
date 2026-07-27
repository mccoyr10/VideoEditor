import { clipEndSec, type Project } from "./types";

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
