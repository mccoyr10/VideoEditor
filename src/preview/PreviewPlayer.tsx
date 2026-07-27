import { useRef } from "react";
import { useTimelineStore } from "../timeline/store/timelineStore";
import { useMediaStore } from "../media/mediaStore";
import { usePlaybackEngine } from "./usePlaybackEngine";
import { totalDurationSec } from "../timeline/model/selectors";
import { formatTime } from "../lib/time";

/**
 * Preview for the (single, for now) video track: a native <video> element
 * whose src is swapped as playback advances across the track's clips.
 * Multi-track/overlay compositing will replace this with a layered
 * renderer once more than one visible track exists at once.
 */
export function PreviewPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const project = useTimelineStore((s) => s.project);
  const sources = useMediaStore((s) => s.sources);
  const playheadSec = useTimelineStore((s) => s.playheadSec);

  const videoTrack = project.tracks.find((t) => t.kind === "video");
  const clips = videoTrack?.clips ?? [];

  const { isPlaying, activeClip, play, pause, seek } = usePlaybackEngine(
    videoRef,
    clips,
    sources,
  );

  if (clips.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Import a video to preview it here
      </div>
    );
  }

  const durationSec = totalDurationSec(project);
  const activeSource = activeClip ? sources[activeClip.sourceId] : null;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
        {!activeSource && (
          <span className="text-sm text-neutral-600">Gap — no clip here</span>
        )}
        <video ref={videoRef} className="max-h-full max-w-full" />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={isPlaying ? pause : play}
          className="rounded bg-neutral-700 px-3 py-1 hover:bg-neutral-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={durationSec}
          step={0.01}
          value={Math.min(playheadSec, durationSec)}
          onChange={(e) => seek(Number(e.currentTarget.value))}
          className="flex-1"
        />
        <span className="tabular-nums text-neutral-400">
          {formatTime(playheadSec)} / {formatTime(durationSec)}
        </span>
      </div>
    </div>
  );
}
