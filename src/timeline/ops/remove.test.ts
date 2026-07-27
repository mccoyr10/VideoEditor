import { describe, expect, it } from "vitest";
import { createClip, createTrack } from "../model/factories";
import { deleteClip } from "./remove";

function trackWithThreeClips() {
  let track = createTrack("video", 0);
  const a = createClip({ sourceId: "s", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
  const b = createClip({ sourceId: "s", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
  const c = createClip({ sourceId: "s", trackId: track.id, startSec: 10, inPointSec: 0, outPointSec: 5 });
  track = { ...track, clips: [a, b, c] };
  return { track, a, b, c };
}

describe("deleteClip", () => {
  it("removes the clip without shifting the others", () => {
    const { track, a, b, c } = trackWithThreeClips();
    const result = deleteClip(track, b.id);
    expect(result.clips.map((clip) => clip.id)).toEqual([a.id, c.id]);
    expect(result.clips.find((clip) => clip.id === a.id)?.startSec).toBe(0);
    expect(result.clips.find((clip) => clip.id === c.id)?.startSec).toBe(10);
  });

  it("clears transitionOut on the preceding clip and transitionIn on the following clip", () => {
    const { track, a, b, c } = trackWithThreeClips();
    const withTransitions: typeof track = {
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === a.id) return { ...clip, transitionOut: { type: "crossfade", durationSec: 0.5 } };
        if (clip.id === c.id) return { ...clip, transitionIn: { type: "crossfade", durationSec: 0.5 } };
        return clip;
      }),
    };
    const result = deleteClip(withTransitions, b.id);
    expect(result.clips.find((clip) => clip.id === a.id)?.transitionOut).toBeUndefined();
    expect(result.clips.find((clip) => clip.id === c.id)?.transitionIn).toBeUndefined();
  });

  it("is a no-op when the clip id doesn't exist", () => {
    const { track } = trackWithThreeClips();
    const result = deleteClip(track, "nonexistent");
    expect(result.clips).toHaveLength(3);
  });
});
