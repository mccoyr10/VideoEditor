import { describe, expect, it } from "vitest";
import { createProject } from "./factories";
import { createClip } from "./factories";
import { totalDurationSec } from "./selectors";

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
        trackId: track.id,
        startSec: 2,
        inPointSec: 0,
        outPointSec: 5,
      }),
    );
    expect(totalDurationSec(project)).toBe(7);
  });
});
