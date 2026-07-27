import type { Project } from "../timeline/model/types";
import { totalDurationSec } from "../timeline/model/selectors";
import type { SourceMedia } from "../media/mediaStore";
import { EXPORT_WIDTH, EXPORT_HEIGHT } from "./constants";
import { planInputs, type PlannedInput } from "./planInputs";
import { buildFilterComplex } from "./buildFilterComplex";

export const OUTPUT_FILE_NAME = "output.mp4";

export interface ProjectCommand {
  args: string[];
  plannedInputs: PlannedInput[];
}

/**
 * Builds the full ffmpeg args for exporting the entire project (all
 * tracks, all clips, transitions) as one file. Replaces buildTrimCommand's
 * role: multi-input, filter_complex, re-encode instead of a single-input
 * stream-copy trim.
 */
export function buildProjectCommand(
  project: Project,
  sources: Record<string, SourceMedia>,
): ProjectCommand {
  const plannedInputs = planInputs(project, sources);
  const fps = project.fps;
  const durationSec = Math.max(totalDurationSec(project), 1 / 1000);

  const graph = buildFilterComplex(project, plannedInputs, {
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    fps,
  });

  const args: string[] = [];
  for (const input of plannedInputs) {
    if (input.source.kind === "image") {
      args.push("-loop", "1", "-framerate", String(fps));
    }
    args.push("-i", input.fileName);
  }

  args.push(
    "-filter_complex",
    graph.filters.join(";"),
    "-map",
    `[${graph.videoLabel}]`,
    "-map",
    `[${graph.audioLabel}]`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "-t",
    durationSec.toFixed(3),
    OUTPUT_FILE_NAME,
  );

  return { args, plannedInputs };
}
