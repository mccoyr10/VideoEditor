import { describe, expect, it } from "vitest";
import { buildTrimCommand } from "./buildCommand";

describe("buildTrimCommand", () => {
  it("builds a stream-copy trim command", () => {
    const args = buildTrimCommand({
      inputFileName: "input.mp4",
      outputFileName: "output.mp4",
      inPointSec: 1.5,
      outPointSec: 9.25,
    });

    expect(args).toEqual([
      "-i",
      "input.mp4",
      "-ss",
      "1.500",
      "-to",
      "9.250",
      "-c",
      "copy",
      "output.mp4",
    ]);
  });
});
