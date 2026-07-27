import { describe, expect, it } from "vitest";
import { canAddSourceKindToTrack } from "./trackCompatibility";

describe("canAddSourceKindToTrack", () => {
  it("video track accepts only video sources", () => {
    expect(canAddSourceKindToTrack("video", "video")).toBe(true);
    expect(canAddSourceKindToTrack("video", "audio")).toBe(false);
    expect(canAddSourceKindToTrack("video", "image")).toBe(false);
  });

  it("audio track accepts only audio sources", () => {
    expect(canAddSourceKindToTrack("audio", "audio")).toBe(true);
    expect(canAddSourceKindToTrack("audio", "video")).toBe(false);
    expect(canAddSourceKindToTrack("audio", "image")).toBe(false);
  });

  it("overlay track accepts images and video, not audio", () => {
    expect(canAddSourceKindToTrack("overlay", "image")).toBe(true);
    expect(canAddSourceKindToTrack("overlay", "video")).toBe(true);
    expect(canAddSourceKindToTrack("overlay", "audio")).toBe(false);
  });
});
