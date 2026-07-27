import { useCallback, useEffect, useRef, useState } from "react";
import { useTimelineStore } from "../timeline/store/timelineStore";

/**
 * An independent timeline clock: advances the store's playheadSec via
 * requestAnimationFrame while playing, with no knowledge of clips, tracks,
 * or media elements. Per-track playback (video/audio sync) is driven
 * separately by TrackLayer/useClipMediaSync, reacting to playheadSec changes.
 */
export function usePlaybackClock(durationSec: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);

  const tick = useCallback(
    (ts: number) => {
      const lastTs = lastTsRef.current ?? ts;
      const deltaSec = (ts - lastTs) / 1000;
      lastTsRef.current = ts;

      const next = useTimelineStore.getState().playheadSec + deltaSec;

      if (next >= durationSec) {
        setPlayhead(durationSec);
        setIsPlaying(false);
        lastTsRef.current = null;
        return;
      }

      setPlayhead(next);
      rafRef.current = requestAnimationFrame(tick);
    },
    [durationSec, setPlayhead],
  );

  const play = useCallback(() => {
    if (durationSec <= 0) return;
    if (useTimelineStore.getState().playheadSec >= durationSec) {
      setPlayhead(0);
    }
    lastTsRef.current = null;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [durationSec, setPlayhead, tick]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const seek = useCallback(
    (sec: number) => {
      setPlayhead(Math.max(0, Math.min(sec, durationSec)));
    },
    [setPlayhead, durationSec],
  );

  useEffect(() => pause, [pause]);

  return { isPlaying, play, pause, seek };
}
