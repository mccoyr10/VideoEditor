import type { Project } from "../timeline/model/types";
import { allClips } from "../timeline/model/selectors";
import type { SourceMedia } from "../media/mediaStore";

export interface PlannedInput {
  sourceId: string;
  /** The ffmpeg -i stream index every filter reference ([N:v]/[N:a]) uses. */
  index: number;
  /** Deterministic virtual filename this source is written to in ffmpeg's FS. */
  fileName: string;
  source: SourceMedia;
}

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx) : "";
}

/**
 * Dedupes sources by sourceId, not clip id -- multiple clips can trim the
 * same imported source, and should share one written file/input index. In
 * first-seen order for determinism.
 */
export function planInputs(
  project: Project,
  sources: Record<string, SourceMedia>,
): PlannedInput[] {
  const seen = new Set<string>();
  const planned: PlannedInput[] = [];

  for (const clip of allClips(project)) {
    if (seen.has(clip.sourceId)) continue;
    const source = sources[clip.sourceId];
    if (!source) continue;
    seen.add(clip.sourceId);
    planned.push({
      sourceId: clip.sourceId,
      index: planned.length,
      fileName: `in${planned.length}${extensionOf(source.file.name)}`,
      source,
    });
  }

  return planned;
}
