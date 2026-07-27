import { useRef } from "react";
import type { Clip, Track } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";
import { activeTrackFrame } from "../timeline/model/selectors";
import { useClipMediaSync } from "./useClipMediaSync";

interface SlotProps {
  clip: Clip | null;
  source: SourceMedia | null;
  weight: number;
  playheadSec: number;
  isPlaying: boolean;
}

function VisualSlot({ clip, source, weight, playheadSec, isPlaying }: SlotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useClipMediaSync(videoRef, clip, source, weight, playheadSec, isPlaying);

  const isImage = !!clip && source?.kind === "image";

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: weight }}>
      {isImage && source ? (
        <img src={source.objectUrl} className="max-h-full max-w-full" alt="" />
      ) : (
        <video
          ref={videoRef}
          className="max-h-full max-w-full"
          style={{ display: clip ? "block" : "none" }}
        />
      )}
    </div>
  );
}

function AudioSlot({ clip, source, weight, playheadSec, isPlaying }: SlotProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useClipMediaSync(audioRef, clip, source, weight, playheadSec, isPlaying);
  return <audio ref={audioRef} />;
}

interface TrackLayerProps {
  track: Track;
  sources: Record<string, SourceMedia>;
  playheadSec: number;
  isPlaying: boolean;
  zIndex: number;
}

/**
 * One compositor layer for a single track. Video/overlay tracks render a
 * visual slot (a <video>, or an <img> for a still image); audio tracks
 * render an invisible <audio> slot that just plays in sync. During a
 * crossfade's overlap window, a second "incoming" slot mounts alongside
 * the primary one, each weighted (opacity for visuals, volume for both)
 * so they blend rather than cut.
 */
export function TrackLayer({
  track,
  sources,
  playheadSec,
  isPlaying,
  zIndex,
}: TrackLayerProps) {
  if (track.hidden) return null;

  const frame = activeTrackFrame(track, playheadSec);
  const primaryClip = frame?.clip ?? null;
  const primarySource = primaryClip ? (sources[primaryClip.sourceId] ?? null) : null;
  const primaryWeight = frame?.weight ?? 1;

  const incomingClip = frame?.next?.clip ?? null;
  const incomingSource = incomingClip ? (sources[incomingClip.sourceId] ?? null) : null;
  const incomingWeight = frame?.next?.weight ?? 0;

  if (track.kind === "audio") {
    return (
      <>
        <AudioSlot
          clip={primaryClip}
          source={primarySource}
          weight={primaryWeight}
          playheadSec={playheadSec}
          isPlaying={isPlaying}
        />
        {incomingClip && (
          <AudioSlot
            clip={incomingClip}
            source={incomingSource}
            weight={incomingWeight}
            playheadSec={playheadSec}
            isPlaying={isPlaying}
          />
        )}
      </>
    );
  }

  return (
    <div className="absolute inset-0" style={{ zIndex }}>
      <VisualSlot
        clip={primaryClip}
        source={primarySource}
        weight={primaryWeight}
        playheadSec={playheadSec}
        isPlaying={isPlaying}
      />
      {incomingClip && (
        <VisualSlot
          clip={incomingClip}
          source={incomingSource}
          weight={incomingWeight}
          playheadSec={playheadSec}
          isPlaying={isPlaying}
        />
      )}
    </div>
  );
}
