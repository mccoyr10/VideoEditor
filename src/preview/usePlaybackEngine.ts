import { useCallback, useEffect, useRef, useState } from "react";
import { useTimelineStore } from "../timeline/store/timelineStore";
import { clipEndSec, type Clip } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";

function findActiveClip(sortedClips: Clip[], timelineSec: number): Clip | null {
  return (
    sortedClips.find(
      (clip) => timelineSec >= clip.startSec && timelineSec < clipEndSec(clip),
    ) ?? null
  );
}

/**
 * Drives a single <video> element through a sequence of clips on one
 * track: keeps playback clamped to the active clip's trim range, and on
 * reaching its end advances to whichever clip starts next rather than
 * stopping (a gap between clips just pauses until the next one's start).
 */
export function usePlaybackEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  clips: Clip[],
  sources: Record<string, SourceMedia>,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeClip, setActiveClipState] = useState<Clip | null>(null);
  const activeClipRef = useRef<Clip | null>(null);
  const rafRef = useRef<number | null>(null);
  const clipsRef = useRef(clips);
  const sourcesRef = useRef(sources);
  clipsRef.current = clips;
  sourcesRef.current = sources;
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);

  const setActiveClip = useCallback((clip: Clip | null) => {
    activeClipRef.current = clip;
    setActiveClipState((prev) => (prev?.id === clip?.id ? prev : clip));
  }, []);

  const sortedClips = useCallback(
    () => [...clipsRef.current].sort((a, b) => a.startSec - b.startSec),
    [],
  );

  /** Points the <video> element at whichever clip is active at timelineSec. */
  const loadClipAt = useCallback(
    (timelineSec: number): Clip | null => {
      const video = videoRef.current;
      const clip = findActiveClip(sortedClips(), timelineSec);
      setActiveClip(clip);
      if (!video || !clip) return clip;

      const source = sourcesRef.current[clip.sourceId];
      if (!source) return clip;

      if (video.dataset.activeClipId !== clip.id) {
        video.dataset.activeClipId = clip.id;
        video.src = source.objectUrl;
        video.currentTime = clip.inPointSec + (timelineSec - clip.startSec);
      }
      return clip;
    },
    [videoRef, sortedClips, setActiveClip],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const current = activeClipRef.current;
    if (!video || !current) {
      setIsPlaying(false);
      return;
    }

    if (video.currentTime >= current.outPointSec) {
      const next = sortedClips().find((c) => c.startSec >= clipEndSec(current));
      if (next) {
        setPlayhead(next.startSec);
        loadClipAt(next.startSec);
        video.play();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        video.pause();
        video.currentTime = current.outPointSec;
        setPlayhead(clipEndSec(current));
        setIsPlaying(false);
      }
      return;
    }

    setPlayhead(current.startSec + (video.currentTime - current.inPointSec));
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef, sortedClips, setPlayhead, loadClipAt]);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const playheadSec = useTimelineStore.getState().playheadSec;
    const clip = loadClipAt(playheadSec);
    if (!clip) return;
    video.play();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef, loadClipAt, tick]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  // Show a frame as soon as clips exist/change, without requiring Play first.
  useEffect(() => {
    loadClipAt(useTimelineStore.getState().playheadSec);
  }, [clips, loadClipAt]);

  const seek = useCallback(
    (timelineSec: number) => {
      const video = videoRef.current;
      const clip = loadClipAt(timelineSec);
      if (!video || !clip) {
        setPlayhead(timelineSec);
        return;
      }
      const sourceSec = Math.max(
        clip.inPointSec,
        Math.min(
          clip.inPointSec + (timelineSec - clip.startSec),
          clip.outPointSec,
        ),
      );
      video.currentTime = sourceSec;
      setPlayhead(clip.startSec + (sourceSec - clip.inPointSec));
    },
    [videoRef, loadClipAt, setPlayhead],
  );

  useEffect(() => pause, [pause]);

  return { isPlaying, activeClip, play, pause, seek };
}
