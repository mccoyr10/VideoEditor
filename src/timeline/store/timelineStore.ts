import { create } from "zustand";
import { createClip, createProject } from "../model/factories";
import type { Project } from "../model/types";
import { trimClip } from "../ops/trim";

interface TimelineState {
  project: Project;
  playheadSec: number;
  selectedClipId: string | null;
  setPlayhead: (sec: number) => void;
  selectClip: (clipId: string | null) => void;
  trim: (
    clipId: string,
    next: { inPointSec?: number; outPointSec?: number },
    sourceDurationSec: number,
  ) => void;
  /** MVP: places a single clip spanning the full source on the first video track. */
  addClip: (sourceId: string, durationSec: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  project: createProject("Untitled project"),
  playheadSec: 0,
  selectedClipId: null,

  setPlayhead: (sec) => set({ playheadSec: Math.max(0, sec) }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  trim: (clipId, next, sourceDurationSec) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === clipId
              ? trimClip(clip, next, sourceDurationSec)
              : clip,
          ),
        })),
      },
    })),

  addClip: (sourceId, durationSec) =>
    set((state) => {
      const videoTrack = state.project.tracks.find((t) => t.kind === "video");
      if (!videoTrack) return state;

      const clip = createClip({
        sourceId,
        trackId: videoTrack.id,
        startSec: 0,
        inPointSec: 0,
        outPointSec: durationSec,
      });

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === videoTrack.id ? { ...track, clips: [clip] } : track,
          ),
        },
        selectedClipId: clip.id,
      };
    }),
}));
