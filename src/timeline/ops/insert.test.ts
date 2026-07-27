import { describe, expect, it } from "vitest";
import { createTrack } from "../model/factories";
import { insertClip } from "./insert";

describe("insertClip", () => {
  it("appends a clip to an empty track", () => {
    const track = createTrack("video", 0);
    const result = insertClip(track, {
      sourceId: "src-1",
      sourceKind: "video",
      startSec: 0,
      inPointSec: 0,
      outPointSec: 5,
    });
    expect(result.clips).toHaveLength(1);
    expect(result.clips[0].startSec).toBe(0);
  });

  it("keeps clips sorted by startSec regardless of insertion order", () => {
    let track = createTrack("video", 0);
    track = insertClip(track, {
      sourceId: "src-1",
      sourceKind: "video",
      startSec: 5,
      inPointSec: 0,
      outPointSec: 8,
    });
    track = insertClip(track, {
      sourceId: "src-2",
      sourceKind: "video",
      startSec: 0,
      inPointSec: 0,
      outPointSec: 3,
    });
    expect(track.clips.map((c) => c.startSec)).toEqual([0, 5]);
  });
});
