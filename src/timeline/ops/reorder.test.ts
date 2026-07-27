import { describe, expect, it } from "vitest";
import { createClip, createTrack } from "../model/factories";
import { moveClipWithinTrack } from "./reorder";

describe("moveClipWithinTrack", () => {
  it("updates the clip's startSec", () => {
    let track = createTrack("video", 0);
    const clip = createClip({ sourceId: "s", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [clip] };

    const result = moveClipWithinTrack(track, clip.id, 12);
    expect(result.clips[0].startSec).toBe(12);
  });

  it("clamps to a non-negative startSec", () => {
    let track = createTrack("video", 0);
    const clip = createClip({ sourceId: "s", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [clip] };

    const result = moveClipWithinTrack(track, clip.id, -10);
    expect(result.clips[0].startSec).toBe(0);
  });

  it("keeps clips sorted by startSec after moving", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [a, b] };

    const result = moveClipWithinTrack(track, a.id, 20);
    expect(result.clips.map((c) => c.id)).toEqual([b.id, a.id]);
  });
});
