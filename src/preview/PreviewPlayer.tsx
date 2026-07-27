import { useRef } from "react";
import { useTimelineStore } from "../timeline/store/timelineStore";
import { useMediaStore } from "../media/mediaStore";
import { usePlaybackEngine } from "./usePlaybackEngine";
import { clipDurationSec } from "../timeline/model/types";
import { formatTime } from "../lib/time";

/**
 * MVP preview: a single native <video> element synced to the one clip on
 * the timeline. Multi-track/overlay compositing will replace this with a
 * <canvas> renderer once more than one visible track exists at once.
 */
export function PreviewPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const project = useTimelineStore((s) => s.project);
  const sources = useMediaStore((s) => s.sources);
  const playheadSec = useTimelineStore((s) => s.playheadSec);

  const clip = project.tracks[0]?.clips[0] ?? null;
  const source = clip ? sources[clip.sourceId] : null;

  const { isPlaying, play, pause, seek } = usePlaybackEngine(videoRef, clip);

  if (!clip || !source) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Import a video to preview it here
      </div>
    );
  }

  const durationSec = clipDurationSec(clip);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          src={source.objectUrl}
          className="max-h-full max-w-full"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = clip.inPointSec;
          }}
        />
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
          min={clip.startSec}
          max={clip.startSec + durationSec}
          step={0.01}
          value={playheadSec}
          onChange={(e) => seek(Number(e.currentTarget.value))}
          className="flex-1"
        />
        <span className="tabular-nums text-neutral-400">
          {formatTime(playheadSec - clip.startSec)} / {formatTime(durationSec)}
        </span>
      </div>
    </div>
  );
}
