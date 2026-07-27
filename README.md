# video-editor

A browser-based video editor: React + Vite + TypeScript, with client-side
export via [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

## Status: MVP slice

The current slice proves the full pipeline end-to-end: import a video,
trim it on a timeline, preview the trimmed range, and export it — all in
the browser, no backend.

**In scope today:** single video track, one clip, drag-to-trim in/out
points, native `<video>` preview clamped to the trim range, and a
stream-copy (no re-encode) export via a same-origin, single-threaded
ffmpeg.wasm core.

**Not built yet (planned):** multiple clips/tracks, transitions, text
overlays, undo/redo, project persistence. See the architecture notes
below for how these are meant to layer on without a rewrite.

## Getting started

```bash
npm install   # also copies the ffmpeg.wasm core into public/ffmpeg (postinstall)
npm run dev
```

```bash
npm test      # vitest — unit tests for the pure timeline/export logic
npm run build # typecheck + production build
```

## Architecture

- `src/timeline/model` / `src/timeline/ops` — framework-free data model and
  pure transformations (trim, etc.), easy to unit test.
- `src/timeline/store` — zustand store holding the project/timeline state.
- `src/media` — imported source file metadata (duration/dimensions probed
  via a detached `<video>` element).
- `src/preview` — playback engine syncing a `<video>` element to the
  timeline's playhead, clamped to the active clip's trim range.
- `src/export` — `buildCommand.ts` is a pure translation from timeline
  state to ffmpeg args; `ffmpegClient.ts` loads/runs ffmpeg.wasm (core
  files served from `public/ffmpeg`, copied from `@ffmpeg/core` at
  `postinstall` so export works with no CDN dependency).
- `src/components` — timeline (ruler, track, clip with trim handles,
  playhead), file import drop zone, export dialog, and the overall layout.

The export seam (`buildCommand.ts`) and the preview/export split
(interactive `<video>`/canvas vs. batch ffmpeg) are deliberate: they're
what let multi-clip/multi-track/transitions/text and eventually a
server-side render path get added later without touching the other
layers.
