import { nanoid } from "nanoid";
import type { SourceMedia } from "./mediaStore";

/**
 * Probes a video file's duration/dimensions by loading it into a detached
 * <video> element, then returns the resulting SourceMedia record.
 */
export function importMedia(file: File): Promise<SourceMedia> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = objectUrl;

    probe.onloadedmetadata = () => {
      resolve({
        id: nanoid(),
        file,
        objectUrl,
        durationSec: probe.duration,
        width: probe.videoWidth,
        height: probe.videoHeight,
      });
    };

    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to read video metadata for "${file.name}"`));
    };
  });
}
