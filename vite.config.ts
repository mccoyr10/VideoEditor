/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// NOTE: ffmpeg.wasm runs the single-threaded core for the MVP, which needs no
// special headers. If a future multi-threaded core is adopted for export
// performance, it requires SharedArrayBuffer, which means adding:
//   server.headers / preview.headers:
//     'Cross-Origin-Opener-Policy': 'same-origin'
//     'Cross-Origin-Embedder-Policy': 'require-corp'
// plus equivalent headers at the eventual static host (e.g. a Netlify _headers file).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
