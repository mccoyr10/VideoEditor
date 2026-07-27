import { describe, expect, it } from "vitest";
import { createClip, createProject, createTrack } from "../timeline/model/factories";
import type { Project } from "../timeline/model/types";
import { planInputs } from "./planInputs";
import { buildFilterComplex } from "./buildFilterComplex";
import type { SourceMedia } from "../media/mediaStore";

const OPTS = { width: 1280, height: 720, fps: 30 };

function videoSource(id: string): SourceMedia {
  return {
    id,
    kind: "video",
    file: new File([], `${id}.mp4`),
    objectUrl: `blob:${id}`,
    durationSec: 20,
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

function graphString(project: Project, sources: Record<string, SourceMedia>) {
  const inputs = planInputs(project, sources);
  const graph = buildFilterComplex(project, inputs, OPTS);
  return graph.filters.join(";");
}

describe("buildFilterComplex", () => {
  it("builds a single concat-free chain for one primary clip", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    const clip = createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 6 });
    track.clips.push(clip);

    const graph = graphString(project, { s1: videoSource("s1") });
    expect(graph).toContain("trim=start=0.000:end=6.000");
    expect(graph).not.toContain("concat=");
    expect(graph).not.toContain("xfade=");
  });

  it("inserts a black filler for a gap on the primary track", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    track.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 3 }),
      createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 5, inPointSec: 0, outPointSec: 8 }),
    );

    const graph = graphString(project, { s1: videoSource("s1") });
    expect(graph).toContain("color=c=black:s=1280x720:r=30:d=2.000");
    expect(graph).toContain("concat=n=2:v=1:a=0");
  });

  it("computes xfade offset as clipEndSec(left) minus the transition duration", () => {
    const project = createProject("test");
    const track = project.tracks[0];
    // Clip A: 0-5s. Clip B transitioned in with a 1s crossfade: startSec 4 (5 - 1).
    const a = createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s1", sourceKind: "video", trackId: track.id, startSec: 4, inPointSec: 0, outPointSec: 5 });
    track.clips.push(
      { ...a, transitionOut: { type: "crossfade", durationSec: 1 } },
      { ...b, transitionIn: { type: "crossfade", durationSec: 1 } },
    );

    const graph = graphString(project, { s1: videoSource("s1") });
    // clipEndSec(a) = 5, duration 1 -> offset = 4
    expect(graph).toContain("xfade=transition=fade:duration=1.000:offset=4.000");
  });

  it("gates a secondary overlay track clip with enable=between using its timeline span", () => {
    const project = createProject("test");
    const videoTrack = project.tracks[0];
    videoTrack.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: videoTrack.id, startSec: 0, inPointSec: 0, outPointSec: 10 }),
    );
    const overlayTrack = createTrack("overlay", 1);
    overlayTrack.clips.push(
      createClip({ sourceId: "s2", sourceKind: "image", trackId: overlayTrack.id, startSec: 2, inPointSec: 0, outPointSec: 4 }),
    );
    project.tracks.push(overlayTrack);

    const graph = graphString(project, { s1: videoSource("s1"), s2: imageSource("s2") });
    // clipEndSec = startSec(2) + duration(outPointSec(4) - inPointSec(0)) = 6
    expect(graph).toContain("overlay=enable='between(t,2.000,6.000)'");
  });

  it("does not emit filters for a hidden secondary track", () => {
    const project = createProject("test");
    const videoTrack = project.tracks[0];
    videoTrack.clips.push(
      createClip({ sourceId: "s1", sourceKind: "video", trackId: videoTrack.id, startSec: 0, inPointSec: 0, outPointSec: 10 }),
    );
    const overlayTrack = { ...createTrack("overlay", 1), hidden: true };
    overlayTrack.clips.push(
      createClip({ sourceId: "s2", sourceKind: "image", trackId: overlayTrack.id, startSec: 2, inPointSec: 0, outPointSec: 4 }),
    );
    project.tracks.push(overlayTrack);

    const graph = graphString(project, { s1: videoSource("s1"), s2: imageSource("s2") });
    expect(graph).not.toContain("overlay=");
  });

  it("positions a single audio clip with adelay at its startSec", () => {
    const project = createProject("test");
    const audioTrack = createTrack("audio", 1);
    audioTrack.clips.push(
      createClip({ sourceId: "s1", sourceKind: "audio", trackId: audioTrack.id, startSec: 3, inPointSec: 0, outPointSec: 5 }),
    );
    project.tracks.push(audioTrack);

    const graph = graphString(project, { s1: { id: "s1", kind: "audio", file: new File([], "s1.mp3"), objectUrl: "blob:s1", durationSec: 10 } });
    expect(graph).toContain("adelay=3000|3000");
  });

  it("uses acrossfade (no offset) for a transitioned audio cluster", () => {
    const project = createProject("test");
    const audioTrack = createTrack("audio", 1);
    const a = createClip({ sourceId: "s1", sourceKind: "audio", trackId: audioTrack.id, startSec: 0, inPointSec: 0, outPointSec: 5 });
    const b = createClip({ sourceId: "s1", sourceKind: "audio", trackId: audioTrack.id, startSec: 4.5, inPointSec: 0, outPointSec: 5 });
    audioTrack.clips.push(
      { ...a, transitionOut: { type: "crossfade", durationSec: 0.5 } },
      { ...b, transitionIn: { type: "crossfade", durationSec: 0.5 } },
    );
    project.tracks.push(audioTrack);

    const graph = graphString(project, { s1: { id: "s1", kind: "audio", file: new File([], "s1.mp3"), objectUrl: "blob:s1", durationSec: 10 } });
    expect(graph).toContain("acrossfade=d=0.500");
  });

  it("falls back to anullsrc when the project has no audio-contributing clips", () => {
    const project = createProject("test"); // default video track, left empty
    const overlayTrack = createTrack("overlay", 1);
    overlayTrack.clips.push(
      createClip({ sourceId: "s1", sourceKind: "image", trackId: overlayTrack.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
    );
    project.tracks.push(overlayTrack);

    const graph = graphString(project, { s1: imageSource("s1") });
    expect(graph).toContain("anullsrc=");
  });

  it("excludes a muted track's clips from the audio mix", () => {
    const project = createProject("test");
    const audioTrack = { ...createTrack("audio", 1), muted: true };
    audioTrack.clips.push(
      createClip({ sourceId: "s1", sourceKind: "audio", trackId: audioTrack.id, startSec: 0, inPointSec: 0, outPointSec: 5 }),
    );
    project.tracks.push(audioTrack);

    const graph = graphString(project, { s1: { id: "s1", kind: "audio", file: new File([], "s1.mp3"), objectUrl: "blob:s1", durationSec: 10 } });
    expect(graph).toContain("anullsrc=");
    expect(graph).not.toContain("adelay=");
  });
});
