import { useTimelineStore } from "../timeline/store/timelineStore";
import { useMediaStore } from "../media/mediaStore";
import { usePlaybackClock } from "./usePlaybackClock";
import { activeClipAt, totalDurationSec } from "../timeline/model/selectors";
import { formatTime } from "../lib/time";
import { TrackLayer } from "./TrackLayer";

/**
 * Compositor preview: one absolutely-positioned layer per track (video and
 * overlay tracks show a <video>/<img>, audio tracks play silently in the
 * background), all driven by a single independent timeline clock so they
 * stay in sync with each other.
 */
export function PreviewPlayer() {
  const project = useTimelineStore((s) => s.project);
  const sources = useMediaStore((s) => s.sources);
  const playheadSec = useTimelineStore((s) => s.playheadSec);

  const videoTrack = project.tracks.find((t) => t.kind === "video");
  const hasVideoClips = (videoTrack?.clips.length ?? 0) > 0;

  const durationSec = totalDurationSec(project);
  const { isPlaying, play, pause, seek } = usePlaybackClock(durationSec);

  if (!hasVideoClips) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Import a video to preview it here
      </div>
    );
  }

  const hasVisibleClip = project.tracks.some(
    (t) =>
      (t.kind === "video" || t.kind === "overlay") &&
      !t.hidden &&
      activeClipAt(t, playheadSec),
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-black">
        {!hasVisibleClip && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600">
            Gap — no clip here
          </div>
        )}
        {project.tracks.map((track, index) => (
          <TrackLayer
            key={track.id}
            track={track}
            sources={sources}
            playheadSec={playheadSec}
            isPlaying={isPlaying}
            zIndex={index}
          />
        ))}
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
