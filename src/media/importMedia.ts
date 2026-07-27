import { nanoid } from "nanoid";
import type { AudioSource, ImageSource, SourceMedia, VideoSource } from "./mediaStore";

/** Default display length assigned to imported still images, which have no intrinsic duration. */
export const DEFAULT_IMAGE_DURATION_SEC = 5;

function importVideo(file: File): Promise<VideoSource> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = objectUrl;

    probe.onloadedmetadata = () => {
      resolve({
        id: nanoid(),
        kind: "video",
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

function importAudio(file: File): Promise<AudioSource> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement("audio");
    probe.preload = "metadata";
    probe.src = objectUrl;

    probe.onloadedmetadata = () => {
      resolve({
        id: nanoid(),
        kind: "audio",
        file,
        objectUrl,
        durationSec: probe.duration,
      });
    };

    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to read audio metadata for "${file.name}"`));
    };
  });
}

function importImage(file: File): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.src = objectUrl;

    probe.onload = () => {
      resolve({
        id: nanoid(),
        kind: "image",
        file,
        objectUrl,
        durationSec: DEFAULT_IMAGE_DURATION_SEC,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
      });
    };

    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to read image "${file.name}"`));
    };
  });
}

/**
 * Probes a media file's metadata (duration, and dimensions where
 * applicable) and returns the resulting SourceMedia record. Dispatches on
 * the file's MIME type; unsupported types are rejected.
 */
export function importMedia(file: File): Promise<SourceMedia> {
  if (file.type.startsWith("video/")) return importVideo(file);
  if (file.type.startsWith("audio/")) return importAudio(file);
  if (file.type.startsWith("image/")) return importImage(file);
  return Promise.reject(new Error(`Unsupported file type: "${file.type || file.name}"`));
}
