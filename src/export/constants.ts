/** Fixed export canvas size — bounds ffmpeg.wasm's single-threaded, in-memory
 * cost regardless of source footage or Project.resolution (which is never
 * actually matched to imported footage anywhere in the app). */
export const EXPORT_WIDTH = 1280;
export const EXPORT_HEIGHT = 720;
