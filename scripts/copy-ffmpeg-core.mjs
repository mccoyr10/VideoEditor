// Copies the ffmpeg.wasm single-threaded core from node_modules into
// public/ffmpeg so it's served same-origin, with no CDN dependency at
// runtime. Runs on postinstall since @ffmpeg/core ships the binary
// already; this just places it where Vite serves static files from.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules/@ffmpeg/core/dist/esm");
const dest = join(root, "public/ffmpeg");

mkdirSync(dest, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  copyFileSync(join(src, file), join(dest, file));
}
console.log(`Copied ffmpeg-core into ${dest}`);
