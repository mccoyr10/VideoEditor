import { describe, expect, it } from "vitest";
import { trimClip } from "./trim";
import { createClip } from "../model/factories";

function baseClip() {
  return createClip({
    sourceId: "src-1",
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
});
