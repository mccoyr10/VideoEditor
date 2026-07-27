import { clipEndSec, type Clip, type Project, type Track } from "../timeline/model/types";
import { totalDurationSec } from "../timeline/model/selectors";
import type { PlannedInput } from "./planInputs";

export interface FilterGraphOpts {
  width: number;
  height: number;
  fps: number;
}

export interface FilterGraphResult {
  /** Individual filter statements -- join with ';' for -filter_complex. */
  filters: string[];
  videoLabel: string;
  audioLabel: string;
}

const EPS = 1 / 1000;

function createLabelGen() {
  const counts: Record<string, number> = {};
  return (prefix: string): string => {
    const n = counts[prefix] ?? 0;
    counts[prefix] = n + 1;
    return `${prefix}${n}`;
  };
}

function fmt(n: number): string {
  return n.toFixed(3);
}

/** Same trim/normalize chain for any real (non-filler) video-producing clip. */
function normalizeClipFilter(
  inputIndex: number,
  clip: Clip,
  outLabel: string,
  opts: FilterGraphOpts,
): string {
  return (
    `[${inputIndex}:v]trim=start=${fmt(clip.inPointSec)}:end=${fmt(clip.outPointSec)},` +
    `setpts=PTS-STARTPTS,fps=${opts.fps},` +
    `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease,` +
    `pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[${outLabel}]`
  );
}

type Segment =
  | { kind: "clip"; clip: Clip }
  | { kind: "filler"; durSec: number };

function buildPrimarySegments(track: Track | undefined, totalDur: number): Segment[] {
  const clips = track ? [...track.clips].sort((a, b) => a.startSec - b.startSec) : [];
  const segments: Segment[] = [];
  let cursor = 0;

  for (const clip of clips) {
    if (clip.startSec > cursor + EPS) {
      segments.push({ kind: "filler", durSec: clip.startSec - cursor });
    }
    segments.push({ kind: "clip", clip });
    cursor = clipEndSec(clip);
  }
  if (cursor < totalDur - EPS) {
    segments.push({ kind: "filler", durSec: totalDur - cursor });
  }
  if (segments.length === 0) {
    segments.push({ kind: "filler", durSec: Math.max(totalDur, EPS) });
  }

  return segments;
}

/**
 * Full trim+concat+xfade fidelity for the primary video track (the first
 * kind==="video" track). Gaps become black filler segments so absolute
 * timeline positions hold for overlay/audio alignment. xfade's `offset` is
 * relative to the running composite, not each clip's own position -- but
 * by construction the running composite's duration after any segment
 * always equals that segment's own clipEndSec (filler duration exactly
 * matches its gap, xfade's shortening-by-D exactly mirrors how
 * setTransition shifted the next clip left by D when the transition was
 * created), so offset collapses to pure data-model arithmetic: the same
 * overlapStart expression activeTrackFrame already uses for the preview.
 */
function buildPrimaryChain(
  primaryTrack: Track | undefined,
  totalDur: number,
  inputIndexOf: (sourceId: string) => number,
  opts: FilterGraphOpts,
  label: (prefix: string) => string,
): { filters: string[]; outLabel: string } {
  const filters: string[] = [];
  const segments = buildPrimarySegments(primaryTrack, totalDur);

  const segLabels = segments.map((seg) => {
    const out = label("seg");
    if (seg.kind === "filler") {
      filters.push(
        `color=c=black:s=${opts.width}x${opts.height}:r=${opts.fps}:d=${fmt(seg.durSec)}[${out}]`,
      );
    } else {
      filters.push(normalizeClipFilter(inputIndexOf(seg.clip.sourceId), seg.clip, out, opts));
    }
    return out;
  });

  let running = segLabels[0];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const out = label("pv");
    if (prev.kind === "clip" && prev.clip.transitionOut) {
      const d = prev.clip.transitionOut.durationSec;
      const offset = clipEndSec(prev.clip) - d;
      filters.push(
        `[${running}][${segLabels[i]}]xfade=transition=fade:duration=${fmt(d)}:offset=${fmt(offset)}[${out}]`,
      );
    } else {
      filters.push(`[${running}][${segLabels[i]}]concat=n=2:v=1:a=0[${out}]`);
    }
    running = out;
  }

  return { filters, outLabel: running };
}

/**
 * Every non-primary, non-audio, non-hidden track's clips are composited as
 * `overlay` applications gated per-clip with enable=between(t,start,end),
 * walked in ascending startSec order -- deliberately never looking at
 * transitionOut here, so a transition on one of these tracks degrades to
 * a hard cut (the later clip's overlay simply wins during any overlap)
 * rather than needing general N-track alpha compositing.
 */
function buildSecondaryOverlays(
  tracks: Track[],
  primaryTrackId: string | undefined,
  baseLabel: string,
  inputIndexOf: (sourceId: string) => number,
  opts: FilterGraphOpts,
  label: (prefix: string) => string,
): { filters: string[]; outLabel: string } {
  const filters: string[] = [];
  let current = baseLabel;

  for (const track of tracks) {
    if (track.id === primaryTrackId) continue;
    if (track.kind === "audio") continue;
    if (track.hidden) continue;

    const clips = [...track.clips].sort((a, b) => a.startSec - b.startSec);
    for (const clip of clips) {
      const clipLabel = label("ov");
      filters.push(normalizeClipFilter(inputIndexOf(clip.sourceId), clip, clipLabel, opts));

      const out = label("comp");
      filters.push(
        `[${current}][${clipLabel}]overlay=enable='between(t,${fmt(clip.startSec)},${fmt(clipEndSec(clip))})'[${out}]`,
      );
      current = out;
    }
  }

  return { filters, outLabel: current };
}

/** Maximal runs of clips linked by transitionOut, in startSec order. */
function clusterByTransition(clips: Clip[]): Clip[][] {
  const sorted = [...clips].sort((a, b) => a.startSec - b.startSec);
  const clusters: Clip[][] = [];
  let current: Clip[] = [];

  for (const clip of sorted) {
    current.push(clip);
    if (!clip.transitionOut) {
      clusters.push(current);
      current = [];
    }
  }
  if (current.length > 0) clusters.push(current);

  return clusters;
}

function buildAudioClusterFilter(
  cluster: Clip[],
  inputIndexOf: (sourceId: string) => number,
  label: (prefix: string) => string,
): { filters: string[]; outLabel: string } {
  const filters: string[] = [];

  const clipLabels = cluster.map((clip) => {
    const out = label("a");
    filters.push(
      `[${inputIndexOf(clip.sourceId)}:a]atrim=start=${fmt(clip.inPointSec)}:end=${fmt(clip.outPointSec)},` +
        `asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[${out}]`,
    );
    return out;
  });

  let running = clipLabels[0];
  for (let i = 1; i < cluster.length; i++) {
    const d = cluster[i - 1].transitionOut!.durationSec;
    const out = label("axf");
    filters.push(`[${running}][${clipLabels[i]}]acrossfade=d=${fmt(d)}[${out}]`);
    running = out;
  }

  const delayed = label("ad");
  const delayMs = Math.round(cluster[0].startSec * 1000);
  filters.push(`[${running}]adelay=${delayMs}|${delayMs}[${delayed}]`);

  return { filters, outLabel: delayed };
}

/**
 * Every audio-contributing track (audio-kind clips, plus embedded audio
 * from video-kind clips on ANY track -- matching current preview
 * behavior, which unmutes/volume-weights every <video> regardless of
 * track) is mixed together, independent of which track is visually
 * primary. Image clips never contribute audio. amix naturally treats
 * absent regions as silence, so unlike the video path no gap-filling is
 * needed, and acrossfade needs no offset parameter at all (unlike xfade).
 */
function buildAudioMix(
  tracks: Track[],
  totalDur: number,
  inputIndexOf: (sourceId: string) => number,
  label: (prefix: string) => string,
): { filters: string[]; outLabel: string } {
  const filters: string[] = [];
  const clusterLabels: string[] = [];

  for (const track of tracks) {
    if (track.hidden || track.muted) continue;
    const audioClips = track.clips.filter((c) => c.sourceKind !== "image");
    if (audioClips.length === 0) continue;

    for (const cluster of clusterByTransition(audioClips)) {
      const { filters: clusterFilters, outLabel } = buildAudioClusterFilter(
        cluster,
        inputIndexOf,
        label,
      );
      filters.push(...clusterFilters);
      clusterLabels.push(outLabel);
    }
  }

  let mixed: string;
  if (clusterLabels.length === 0) {
    mixed = label("anull");
    filters.push(`anullsrc=r=48000:cl=stereo:d=${fmt(Math.max(totalDur, EPS))}[${mixed}]`);
  } else {
    mixed = label("amix");
    const inputsRef = clusterLabels.map((l) => `[${l}]`).join("");
    filters.push(
      `${inputsRef}amix=inputs=${clusterLabels.length}:duration=longest:dropout_transition=0[${mixed}]`,
    );
  }

  const final = label("aout");
  filters.push(`[${mixed}]apad,atrim=end=${fmt(Math.max(totalDur, EPS))}[${final}]`);

  return { filters, outLabel: final };
}

export function buildFilterComplex(
  project: Project,
  inputs: PlannedInput[],
  opts: FilterGraphOpts,
): FilterGraphResult {
  const label = createLabelGen();
  const inputIndexOf = (sourceId: string): number => {
    const found = inputs.find((i) => i.sourceId === sourceId);
    if (!found) throw new Error(`No planned input for source "${sourceId}"`);
    return found.index;
  };

  const totalDur = totalDurationSec(project);
  const primaryTrack = project.tracks.find((t) => t.kind === "video");

  const filters: string[] = [];

  const primary = buildPrimaryChain(primaryTrack, totalDur, inputIndexOf, opts, label);
  filters.push(...primary.filters);

  const composited = buildSecondaryOverlays(
    project.tracks,
    primaryTrack?.id,
    primary.outLabel,
    inputIndexOf,
    opts,
    label,
  );
  filters.push(...composited.filters);

  const videoFinal = label("vout");
  filters.push(`[${composited.outLabel}]format=yuv420p[${videoFinal}]`);

  const audio = buildAudioMix(project.tracks, totalDur, inputIndexOf, label);
  filters.push(...audio.filters);

  return { filters, videoLabel: videoFinal, audioLabel: audio.outLabel };
}
