import { describe, expect, it } from "vitest";
import { createClip, createProject } from "../timeline/model/factories";
import { planInputs } from "./planInputs";
import type { SourceMedia } from "../media/mediaStore";

function videoSource(id: string): SourceMedia {
  return {
    id,
    kind: "video",
    file: new File([], `${id}.mp4`),
    objectUrl: `blob:${id}`,
    durationSec: 10,
    width: 640,
    height: 360,
  };
}

describe("planInputs", () => {
  it("assigns one planned input per clip when sources differ", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
      createClip({ sourceId: "s2", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 5 }),
    );
    const sources = { s1: videoSource("s1"), s2: videoSource("s2") };

    const planned = planInputs(project, sources);
    expect(planned.map((p) => p.sourceId)).toEqual(["s1", "s2"]);
    expect(planned.map((p) => p.index)).toEqual([0, 1]);
  });

  it("dedupes clips that share the same sourceId", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 3 }),
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 3, inPointSec: 3, outPointSec: 6 }),
    );
    const sources = { s1: videoSource("s1") };

    const planned = planInputs(project, sources);
    expect(planned).toHaveLength(1);
  });

  it("skips clips whose source is missing from the media store", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "missing", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 3 }),
    );
    expect(planInputs(project, {})).toEqual([]);
  });

  it("gives each planned input a deterministic filename with the source's extension", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 3 }),
    );
    const planned = planInputs(project, { s1: videoSource("s1") });
    expect(planned[0].fileName).toBe("in0.mp4");
  });
});
