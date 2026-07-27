import { describe, expect, it } from "vitest";
import { createClip, createProject } from "../timeline/model/factories";
import { buildProjectCommand, OUTPUT_FILE_NAME } from "./buildProjectCommand";
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

function imageSource(id: string): SourceMedia {
  return {
    id,
    kind: "image",
    file: new File([], `${id}.png`),
    objectUrl: `blob:${id}`,
    durationSec: 5,
    width: 640,
    height: 360,
  };
}

describe("buildProjectCommand", () => {
  it("adds -loop/-framerate flags before an image input but not a video input", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "vid", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
    );
    const overlay = { ...project.tracks[0], id: "overlay-track", kind: "overlay" as const, clips: [] as typeof track.clips, index: 1 };
    overlay.clips.push(
      createClip({ sourceId: "img", sourceKind: "image", trackId: overlay.id, startSec: 0, inPointSec: 0, outPointSec: 3 }),
    );
    project.tracks.push(overlay);

    const { args } = buildProjectCommand(project, { vid: videoSource("vid"), img: imageSource("img") });

    const vidIdx = args.indexOf("in0.mp4");
    expect(args[vidIdx - 1]).toBe("-i");
    expect(args[vidIdx - 2]).not.toBe("-framerate");

    const imgIdx = args.indexOf("in1.png");
    expect(args[imgIdx - 1]).toBe("-i");
    expect(args.slice(0, imgIdx)).toEqual(
      expect.arrayContaining(["-loop", "1", "-framerate"]),
    );
  });

  it("includes encode settings and the output filename", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "vid", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
    );
    const { args } = buildProjectCommand(project, { vid: videoSource("vid") });

    expect(args).toEqual(
      expect.arrayContaining(["-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p"]),
    );
    expect(args[args.length - 1]).toBe(OUTPUT_FILE_NAME);
  });

  it("clamps -t to the project's total duration", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "vid", sourceKind: "video", trackId: track.id, startSec: 2, inPointSec: 0, outPointSec: 5 }),
    );
    const { args } = buildProjectCommand(project, { vid: videoSource("vid") });
    const tIdx = args.indexOf("-t");
    expect(args[tIdx + 1]).toBe("7.000"); // startSec(2) + duration(5-0)
  });
});
