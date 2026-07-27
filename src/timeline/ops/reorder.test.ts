import { describe, expect, it } from "vitest";
import { createClip, createTrack } from "../model/factories";
import { moveClipToTrack, moveClipWithinTrack } from "./reorder";

describe("moveClipWithinTrack", () => {
  it("updates the clip's startSec", () => {
    let track = createTrack("video", 0);
    const clip = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [clip] };

    const result = moveClipWithinTrack(track, clip.id, 12);
    expect(result.clips[0].startSec).toBe(12);
  });

  it("clamps to a non-negative startSec", () => {
    let track = createTrack("video", 0);
    const clip = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [clip] };

    const result = moveClipWithinTrack(track, clip.id, -10);
    expect(result.clips[0].startSec).toBe(0);
  });

  it("keeps clips sorted by startSec after moving", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [a, b] };

    const result = moveClipWithinTrack(track, a.id, 20);
    expect(result.clips.map((c) => c.id)).toEqual([b.id, a.id]);
  });

  it("clears the moved clip's own transition fields", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({
      sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5,
    });
    track = {
      ...track,
      clips: [
        { ...a, transitionOut: { type: "crossfade", durationSec: 1 } },
        { ...b, transitionIn: { type: "crossfade", durationSec: 1 } },
      ],
    };

    const result = moveClipWithinTrack(track, b.id, 20);
    const movedB = result.clips.find((c) => c.id === b.id)!;
    expect(movedB.transitionIn).toBeUndefined();
  });

  it("clears the old neighbor's matching transition field", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    track = {
      ...track,
      clips: [
        { ...a, transitionOut: { type: "crossfade", durationSec: 1 } },
        { ...b, transitionIn: { type: "crossfade", durationSec: 1 } },
      ],
    };

    const result = moveClipWithinTrack(track, b.id, 20);
    const movedA = result.clips.find((c) => c.id === a.id)!;
    expect(movedA.transitionOut).toBeUndefined();
  });
});

describe("moveClipToTrack", () => {
  it("moves the clip from the source track's clips to the target track's clips", () => {
    const sourceTrack = createTrack("video", 0);
    const targetTrack = createTrack("overlay", 1);
    const clip = createClip({
      sourceId: "s",
      sourceKind: "video",
      trackId: sourceTrack.id,
      startSec: 0,
      inPointSec: 0,
      outPointSec: 5,
    });
    const withClip = { ...sourceTrack, clips: [clip] };

    const result = moveClipToTrack(withClip, targetTrack, clip.id, 3);
    expect(result).not.toBeNull();
    expect(result!.sourceTrack.clips).toHaveLength(0);
    expect(result!.targetTrack.clips).toHaveLength(1);
    expect(result!.targetTrack.clips[0].startSec).toBe(3);
    expect(result!.targetTrack.clips[0].trackId).toBe(targetTrack.id);
  });

  it("clamps the new startSec to non-negative", () => {
    const sourceTrack = createTrack("video", 0);
    const targetTrack = createTrack("overlay", 1);
    const clip = createClip({
      sourceId: "s",
      sourceKind: "video",
      trackId: sourceTrack.id,
      startSec: 0,
      inPointSec: 0,
      outPointSec: 5,
    });
    const withClip = { ...sourceTrack, clips: [clip] };

    const result = moveClipToTrack(withClip, targetTrack, clip.id, -10);
    expect(result!.targetTrack.clips[0].startSec).toBe(0);
  });

  it("returns null when the clip isn't on the source track", () => {
    const sourceTrack = createTrack("video", 0);
    const targetTrack = createTrack("overlay", 1);
    expect(moveClipToTrack(sourceTrack, targetTrack, "nonexistent", 0)).toBeNull();
  });

  it("clears the moved clip's transition fields and the old neighbor's matching field", () => {
    let sourceTrack = createTrack("video", 0);
    const targetTrack = createTrack("overlay", 1);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: sourceTrack.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", sourceKind: "video", trackId: sourceTrack.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
    sourceTrack = {
      ...sourceTrack,
      clips: [
        { ...a, transitionOut: { type: "crossfade", durationSec: 1 } },
        { ...b, transitionIn: { type: "crossfade", durationSec: 1 } },
      ],
    };

    const result = moveClipToTrack(sourceTrack, targetTrack, b.id, 0)!;
    expect(result.targetTrack.clips[0].transitionIn).toBeUndefined();
    const remainingA = result.sourceTrack.clips.find((c) => c.id === a.id)!;
    expect(remainingA.transitionOut).toBeUndefined();
  });
});
