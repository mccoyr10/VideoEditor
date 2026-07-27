import { describe, expect, it } from "vitest";
import { createClip, createTrack } from "../model/factories";
import { setTransition } from "./transition";
import { clipEndSec } from "../model/types";

function threeAdjacentClips() {
  let track = createTrack("video", 0);
  const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
  const b = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 });
  const c = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 10, inPointSec: 0, outPointSec: 5 });
  track = { ...track, clips: [a, b, c] };
  return { track, a, b, c };
}

describe("setTransition", () => {
  it("shifts the right clip left by the transition duration", () => {
    const { track, a, b } = threeAdjacentClips();
    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const newB = result.clips.find((c) => c.id === b.id)!;
    expect(newB.startSec).toBe(4);
  });

  it("ripple-shifts clips after the right clip by the same amount", () => {
    const { track, a, b, c } = threeAdjacentClips();
    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const newC = result.clips.find((clip) => clip.id === c.id)!;
    expect(newC.startSec).toBe(9);
  });

  it("sets transitionOut on the left clip and transitionIn on the right clip", () => {
    const { track, a, b } = threeAdjacentClips();
    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const newA = result.clips.find((c) => c.id === a.id)!;
    const newB = result.clips.find((c) => c.id === b.id)!;
    expect(newA.transitionOut).toEqual({ type: "crossfade", durationSec: 1 });
    expect(newB.transitionIn).toEqual({ type: "crossfade", durationSec: 1 });
  });

  it("does not change the left clip's own start/end", () => {
    const { track, a, b } = threeAdjacentClips();
    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const newA = result.clips.find((c) => c.id === a.id)!;
    expect(newA.startSec).toBe(a.startSec);
    expect(clipEndSec(newA)).toBe(clipEndSec(a));
  });

  it("clamps duration to fit within the shorter of the two clips", () => {
    const { track, a, b } = threeAdjacentClips(); // both 5s long
    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 100 });
    const newA = result.clips.find((c) => c.id === a.id)!;
    expect(newA.transitionOut!.durationSec).toBeLessThan(5);
  });

  it("removing a transition (null) restores the original position and clears fields", () => {
    const { track, a, b, c } = threeAdjacentClips();
    const withTransition = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const removed = setTransition(withTransition, a.id, b.id, null);

    const newA = removed.clips.find((clip) => clip.id === a.id)!;
    const newB = removed.clips.find((clip) => clip.id === b.id)!;
    const newC = removed.clips.find((clip) => clip.id === c.id)!;

    expect(newA.transitionOut).toBeUndefined();
    expect(newB.transitionIn).toBeUndefined();
    expect(newB.startSec).toBe(5);
    expect(newC.startSec).toBe(10);
  });

  it("resizing an existing transition adjusts the shift by the delta", () => {
    const { track, a, b } = threeAdjacentClips();
    const withOneSec = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    const withTwoSec = setTransition(withOneSec, a.id, b.id, { type: "crossfade", durationSec: 2 });
    const newB = withTwoSec.clips.find((c) => c.id === b.id)!;
    expect(newB.startSec).toBe(3);
  });

  it("is a no-op when the clips aren't adjacent (a gap exists)", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 8, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [a, b] };

    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    expect(result).toBe(track);
  });

  it("is a no-op when the clips overlap without a prior transition between them", () => {
    let track = createTrack("video", 0);
    const a = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 3, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [a, b] };

    const result = setTransition(track, a.id, b.id, { type: "crossfade", durationSec: 1 });
    expect(result).toBe(track);
  });
});
