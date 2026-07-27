import { describe, expect, it } from "vitest";
import { createClip } from "../model/factories";
import { splitClip } from "./split";
import { clipDurationSec } from "../model/types";

function baseClip() {
  return createClip({
    sourceId: "src-1",
    sourceKind: "video",
    trackId: "track-1",
    startSec: 10,
    inPointSec: 2,
    outPointSec: 12,
  });
}

describe("splitClip", () => {
  it("splits into two clips whose durations sum to the original", () => {
    const clip = baseClip();
    const result = splitClip(clip, 14); // 4s into the clip
    expect(result).not.toBeNull();
    const [left, right] = result!;
    expect(clipDurationSec(left) + clipDurationSec(right)).toBeCloseTo(
      clipDurationSec(clip),
    );
  });

  it("computes the source-time split point relative to inPointSec", () => {
    const clip = baseClip();
    const [left, right] = splitClip(clip, 14)!;
    expect(left.inPointSec).toBe(2);
    expect(left.outPointSec).toBe(6); // inPoint(2) + 4s in
    expect(right.inPointSec).toBe(6);
    expect(right.outPointSec).toBe(12);
  });

  it("positions the right half at the split point on the timeline", () => {
    const clip = baseClip();
    const [, right] = splitClip(clip, 14)!;
    expect(right.startSec).toBe(14);
  });

  it("assigns a new id to the right half only", () => {
    const clip = baseClip();
    const [left, right] = splitClip(clip, 14)!;
    expect(left.id).toBe(clip.id);
    expect(right.id).not.toBe(clip.id);
  });

  it("clears transitionOut on the left half and transitionIn on the right half", () => {
    const clip = {
      ...baseClip(),
      transitionIn: { type: "crossfade" as const, durationSec: 0.5 },
      transitionOut: { type: "crossfade" as const, durationSec: 0.5 },
    };
    const [left, right] = splitClip(clip, 14)!;
    expect(left.transitionIn).toBeDefined();
    expect(left.transitionOut).toBeUndefined();
    expect(right.transitionIn).toBeUndefined();
    expect(right.transitionOut).toBeDefined();
  });

  it("returns null when the split point is at or before the clip start", () => {
    const clip = baseClip();
    expect(splitClip(clip, 10)).toBeNull();
    expect(splitClip(clip, 9)).toBeNull();
  });

  it("returns null when the split point is at or after the clip end", () => {
    const clip = baseClip();
    expect(splitClip(clip, 20)).toBeNull();
    expect(splitClip(clip, 21)).toBeNull();
  });
});
