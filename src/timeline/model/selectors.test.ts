import { describe, expect, it } from "vitest";
import { createProject, createTrack } from "./factories";
import { createClip } from "./factories";
import { activeClipAt, totalDurationSec } from "./selectors";

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
