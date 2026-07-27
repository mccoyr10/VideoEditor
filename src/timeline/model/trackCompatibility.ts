import type { MediaKind, TrackKind } from "./types";

/**
 * Which imported-media kinds are allowed on which track kinds. Overlay
 * tracks accept both images and video, so picture-in-picture / video-over-
 * video b-roll works without a dedicated fourth track kind.
 */
export function canAddSourceKindToTrack(
  trackKind: TrackKind,
  sourceKind: MediaKind,
): boolean {
  switch (trackKind) {
    case "video":
      return sourceKind === "video";
    case "audio":
      return sourceKind === "audio";
    case "overlay":
      return sourceKind === "image" || sourceKind === "video";
  }
}
