import { useRef } from "react";
import type { Track } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";
import { useTrackLayer } from "./useTrackLayer";

interface TrackLayerProps {
  track: Track;
  sources: Record<string, SourceMedia>;
  playheadSec: number;
  isPlaying: boolean;
  zIndex: number;
}

/**
 * One compositor layer for a single track. Video/overlay tracks render a
 * visual element (a <video>, or an <img> for a still image); audio tracks
 * render an invisible <audio> element that just plays in sync.
 */
export function TrackLayer({
  track,
  sources,
  playheadSec,
  isPlaying,
  zIndex,
}: TrackLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRef = track.kind === "audio" ? audioRef : videoRef;

  const { activeClip, source } = useTrackLayer(
    mediaRef,
    track,
    sources,
    playheadSec,
    isPlaying,
  );

  if (track.hidden) return null;

  if (track.kind === "audio") {
    return <audio ref={audioRef} muted={track.muted} />;
  }

  const isImage = !!activeClip && source?.kind === "image";

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex }}>
      {isImage && source ? (
        <img src={source.objectUrl} className="max-h-full max-w-full" alt="" />
      ) : (
        <video
          ref={videoRef}
          className="max-h-full max-w-full"
          muted={track.muted}
          style={{ display: activeClip ? "block" : "none" }}
        />
      )}
    </div>
  );
}
