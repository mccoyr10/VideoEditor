import { useEffect, useMemo } from "react";
import { activeClipAt } from "../timeline/model/selectors";
import type { Clip, Track } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";

const DRIFT_THRESHOLD_SEC = 0.2;

/**
 * Resolves the clip active on a track at the current playhead, and syncs a
 * <video>/<audio> element to it: swaps src on clip change, corrects drift
 * against the expected source time each tick, and follows the shared
 * isPlaying state. Image-sourced clips are handled by the caller (no
 * media element to sync) -- this hook still returns the active clip/source
 * for that case, it just skips the element-sync effects.
 */
export function useTrackLayer(
  mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>,
  track: Track,
  sources: Record<string, SourceMedia>,
  playheadSec: number,
  isPlaying: boolean,
): { activeClip: Clip | null; source: SourceMedia | null } {
  const activeClip = useMemo(
    () => activeClipAt(track, playheadSec),
    [track, playheadSec],
  );
  const source = activeClip ? (sources[activeClip.sourceId] ?? null) : null;
  const isMediaElement = !!source && source.kind !== "image";

  // Swap the element's src when the active clip changes.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (!activeClip || !source || !isMediaElement) {
      el.pause();
      delete el.dataset.activeClipId;
      return;
    }
    if (el.dataset.activeClipId !== activeClip.id) {
      el.dataset.activeClipId = activeClip.id;
      el.src = source.objectUrl;
      el.currentTime = activeClip.inPointSec + (playheadSec - activeClip.startSec);
    }
    // playheadSec deliberately excluded: only re-sync src when the clip itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRef, activeClip, source, isMediaElement]);

  // Drift correction + play/pause, every tick.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !activeClip || !isMediaElement) return;

    const sourceSec = activeClip.inPointSec + (playheadSec - activeClip.startSec);
    if (Math.abs(el.currentTime - sourceSec) > DRIFT_THRESHOLD_SEC) {
      el.currentTime = sourceSec;
    }

    if (isPlaying && el.paused) {
      el.play().catch(() => {});
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [mediaRef, activeClip, isMediaElement, playheadSec, isPlaying]);

  return { activeClip, source };
}
