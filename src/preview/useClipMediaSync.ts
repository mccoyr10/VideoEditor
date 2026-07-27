import { useEffect } from "react";
import type { Clip } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";

const DRIFT_THRESHOLD_SEC = 0.2;

/**
 * Syncs a single <video>/<audio> element to one specific clip: swaps src
 * on clip change, corrects drift against the expected source time each
 * tick (rather than reseeking every frame), follows the shared isPlaying
 * state, and applies `weight` as volume so audio fades along with visual
 * opacity during a crossfade. A null clip pauses/clears the element.
 * Image-sourced clips have no media element to sync, so this is a no-op
 * for them (the caller renders an <img> instead).
 */
export function useClipMediaSync(
  mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>,
  clip: Clip | null,
  source: SourceMedia | null,
  weight: number,
  playheadSec: number,
  isPlaying: boolean,
): void {
  const isMediaElement = !!source && source.kind !== "image";

  // Swap the element's src when the active clip changes.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (!clip || !source || !isMediaElement) {
      el.pause();
      delete el.dataset.activeClipId;
      return;
    }
    if (el.dataset.activeClipId !== clip.id) {
      el.dataset.activeClipId = clip.id;
      el.src = source.objectUrl;
      el.currentTime = clip.inPointSec + (playheadSec - clip.startSec);
    }
    // playheadSec deliberately excluded: only re-sync src when the clip itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRef, clip, source, isMediaElement]);

  // Drift correction + play/pause + volume, every tick.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !clip || !isMediaElement) return;

    const sourceSec = clip.inPointSec + (playheadSec - clip.startSec);
    if (Math.abs(el.currentTime - sourceSec) > DRIFT_THRESHOLD_SEC) {
      el.currentTime = sourceSec;
    }

    el.volume = Math.max(0, Math.min(1, weight));

    if (isPlaying && el.paused) {
      el.play().catch(() => {});
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [mediaRef, clip, isMediaElement, playheadSec, isPlaying, weight]);
}
