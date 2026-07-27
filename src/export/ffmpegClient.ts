import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// Single-threaded ffmpeg.wasm core: no SharedArrayBuffer / COOP-COEP headers
// required, which keeps the MVP's deploy story simple. Served same-origin
// from public/ffmpeg (copied from node_modules/@ffmpeg/core by
// scripts/copy-ffmpeg-core.mjs on postinstall) rather than a CDN, so export
// keeps working offline or behind networks that block third-party CDNs.
const CORE_BASE_URL = "/ffmpeg";

type ProgressListener = (progress: number) => void;
let progressListener: ProgressListener | null = null;

export function onFFmpegProgress(listener: ProgressListener | null) {
  progressListener = listener;
}

let loadPromise: Promise<FFmpeg> | null = null;

export function getFFmpeg(): Promise<FFmpeg> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      progressListener?.(Math.min(1, Math.max(0, progress)));
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.js`,
        "text/javascript",
      ),
      wasmURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    return ffmpeg;
  })();

  return loadPromise;
}
