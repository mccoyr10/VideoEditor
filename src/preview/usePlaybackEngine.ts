import { useCallback, useEffect, useRef, useState } from "react";
import { useTimelineStore } from "../timeline/store/timelineStore";
import type { Clip } from "../timeline/model/types";

/**
 * Drives a <video> element from a single timeline clip: keeps playback
 * clamped to [inPointSec, outPointSec] and keeps the store's playhead in
 * sync with the video's currentTime while playing.
 */
export function usePlaybackEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  clip: Clip | null,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);

  const toSourceTime = useCallback(
    (timelineSec: number) => {
      if (!clip) return 0;
      return clip.inPointSec + (timelineSec - clip.startSec);
    },
    [clip],
  );

  const toTimelineTime = useCallback(
    (sourceSec: number) => {
      if (!clip) return 0;
      return clip.startSec + (sourceSec - clip.inPointSec);
    },
    [clip],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || !clip) return;

    if (video.currentTime >= clip.outPointSec) {
      video.pause();
      video.currentTime = clip.outPointSec;
      setPlayhead(toTimelineTime(clip.outPointSec));
      setIsPlaying(false);
      return;
    }

    setPlayhead(toTimelineTime(video.currentTime));
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef, clip, setPlayhead, toTimelineTime]);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || !clip) return;
    if (video.currentTime < clip.inPointSec || video.currentTime >= clip.outPointSec) {
      video.currentTime = clip.inPointSec;
    }
    video.play();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef, clip, tick]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  const seek = useCallback(
    (timelineSec: number) => {
      const video = videoRef.current;
      if (!video || !clip) return;
      const sourceSec = Math.max(
        clip.inPointSec,
        Math.min(toSourceTime(timelineSec), clip.outPointSec),
      );
      video.currentTime = sourceSec;
      setPlayhead(toTimelineTime(sourceSec));
    },
    [videoRef, clip, toSourceTime, toTimelineTime, setPlayhead],
  );

  useEffect(() => pause, [pause]);

  return { isPlaying, play, pause, seek };
}
