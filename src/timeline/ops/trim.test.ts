import { describe, expect, it } from "vitest";
import { trimClip } from "./trim";
import { createClip } from "../model/factories";

function baseClip() {
  return createClip({
    sourceId: "src-1",
    sourceKind: "video",
    trackId: "track-1",
    startSec: 0,
    inPointSec: 0,
    outPointSec: 10,
  });
}

describe("trimClip", () => {
  it("adjusts inPointSec", () => {
    const clip = trimClip(baseClip(), { inPointSec: 2 }, 10);
    expect(clip.inPointSec).toBe(2);
    expect(clip.outPointSec).toBe(10);
  });

  it("adjusts outPointSec", () => {
    const clip = trimClip(baseClip(), { outPointSec: 6 }, 10);
    expect(clip.outPointSec).toBe(6);
    expect(clip.inPointSec).toBe(0);
  });

  it("clamps inPointSec to 0", () => {
    const clip = trimClip(baseClip(), { inPointSec: -5 }, 10);
    expect(clip.inPointSec).toBe(0);
  });

  it("clamps outPointSec to source duration", () => {
    const clip = trimClip(baseClip(), { outPointSec: 999 }, 10);
    expect(clip.outPointSec).toBe(10);
  });

  it("prevents inPointSec from crossing outPointSec", () => {
    const clip = trimClip(baseClip(), { inPointSec: 15 }, 10);
    expect(clip.inPointSec).toBeLessThan(clip.outPointSec);
  });

  it("prevents outPointSec from crossing inPointSec", () => {
    const withIn = trimClip(baseClip(), { inPointSec: 5 }, 10);
    const clip = trimClip(withIn, { outPointSec: 1 }, 10);
    expect(clip.outPointSec).toBeGreaterThan(clip.inPointSec);
  });

  it("leaves transitions untouched when they still fit", () => {
    const clip = {
      ...baseClip(),
      transitionIn: { type: "crossfade" as const, durationSec: 1 },
      transitionOut: { type: "crossfade" as const, durationSec: 1 },
    };
    const result = trimClip(clip, { outPointSec: 8 }, 10); // still 8s long, plenty of room
    expect(result.transitionIn!.durationSec).toBe(1);
    expect(result.transitionOut!.durationSec).toBe(1);
  });

  it("clamps a transition duration down to fit a shortened clip", () => {
    const clip = {
      ...baseClip(),
      transitionOut: { type: "crossfade" as const, durationSec: 3 },
    };
    const result = trimClip(clip, { outPointSec: 2 }, 10); // now only 2s long
    expect(result.transitionOut!.durationSec).toBeLessThan(2);
  });

  it("clears a transition entirely when the clip is trimmed to (near) nothing", () => {
    const clip = {
      ...baseClip(),
      inPointSec: 0,
      outPointSec: 1 / 30, // already at the minimum gap
      transitionOut: { type: "crossfade" as const, durationSec: 3 },
    };
    const result = trimClip(clip, {}, 10);
    expect(result.transitionOut).toBeUndefined();
  });
});
