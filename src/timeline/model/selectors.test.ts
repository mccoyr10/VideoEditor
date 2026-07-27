import { describe, expect, it } from "vitest";
import { createProject, createTrack } from "./factories";
import { createClip } from "./factories";
import { activeClipAt, activeTrackFrame, totalDurationSec } from "./selectors";

describe("totalDurationSec", () => {
  it("is 0 for an empty project", () => {
    expect(totalDurationSec(createProject("test"))).toBe(0);
  });

  it("matches the end of the last clip", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({
        sourceId: "src-1",
        sourceKind: "video",
        trackId: track.id,
        startSec: 2,
        inPointSec: 0,
        outPointSec: 5,
      }),
    );
    expect(totalDurationSec(project)).toBe(7);
  });
});

describe("activeClipAt", () => {
  function trackWithClip() {
    const track = createTrack("video", 0);
    const clip = createClip({
      sourceId: "src-1",
      sourceKind: "video",
      trackId: track.id,
      startSec: 5,
      inPointSec: 0,
      outPointSec: 3,
    });
    return { track: { ...track, clips: [clip] }, clip };
  }

  it("returns the clip containing sec", () => {
    const { track, clip } = trackWithClip();
    expect(activeClipAt(track, 6)?.id).toBe(clip.id);
  });

  it("is inclusive of startSec", () => {
    const { track, clip } = trackWithClip();
    expect(activeClipAt(track, 5)?.id).toBe(clip.id);
  });

  it("is exclusive of the end", () => {
    const { track } = trackWithClip();
    expect(activeClipAt(track, 8)).toBeNull();
  });

  it("returns null before the clip starts", () => {
    const { track } = trackWithClip();
    expect(activeClipAt(track, 4)).toBeNull();
  });

  it("returns null for an empty track", () => {
    const track = createTrack("audio", 0);
    expect(activeClipAt(track, 0)).toBeNull();
  });
});

describe("activeTrackFrame", () => {
  function trackWithTransition() {
    let track = createTrack("video", 0);
    const a = {
      ...createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
      transitionOut: { type: "crossfade" as const, durationSec: 1 },
    };
    // Right clip already shifted left by the 1s transition, as setTransition would do.
    const b = {
      ...createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 4, inPointSec: 0, outPointSec: 5 }),
      transitionIn: { type: "crossfade" as const, durationSec: 1 },
    };
    track = { ...track, clips: [a, b] };
    return { track, a, b };
  }

  it("returns just the clip with full weight outside any transition window", () => {
    const { track, a } = trackWithTransition();
    const frame = activeTrackFrame(track, 2);
    expect(frame?.clip.id).toBe(a.id);
    expect(frame?.weight).toBe(1);
    expect(frame?.next).toBeUndefined();
  });

  it("returns both clips with complementary weights inside the overlap window", () => {
    const { track, a, b } = trackWithTransition();
    const frame = activeTrackFrame(track, 4.5); // midpoint of [4, 5) overlap
    expect(frame?.clip.id).toBe(a.id);
    expect(frame?.next?.clip.id).toBe(b.id);
    expect(frame!.weight + frame!.next!.weight).toBeCloseTo(1);
    expect(frame!.weight).toBeCloseTo(0.5, 1);
  });

  it("weight fades from 1 to 0 across the window", () => {
    const { track } = trackWithTransition();
    const start = activeTrackFrame(track, 4);
    const nearEnd = activeTrackFrame(track, 4.9);
    expect(start!.weight).toBeGreaterThan(nearEnd!.weight);
  });

  it("has no next clip when there's no transitionOut", () => {
    let track = createTrack("video", 0);
    const clip = createClip({ sourceId: "s", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    track = { ...track, clips: [clip] };
    expect(activeTrackFrame(track, 2)?.next).toBeUndefined();
  });

  it("returns null when no clip is active", () => {
    const track = createTrack("video", 0);
    expect(activeTrackFrame(track, 0)).toBeNull();
  });
});
