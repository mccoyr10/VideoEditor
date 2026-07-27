import { create } from "zustand";
import { createProject } from "../model/factories";
import { clipEndSec, type Project } from "../model/types";
import { trimClip } from "../ops/trim";
import { insertClip } from "../ops/insert";
import { splitClip } from "../ops/split";
import { deleteClip as deleteClipOp } from "../ops/remove";
import { moveClipWithinTrack } from "../ops/reorder";

interface AddClipOptions {
  trackId?: string;
  startSec?: number;
}

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
  /** Appends a clip to a track (default: first video track, after its last clip). */
  addClip: (
    sourceId: string,
    durationSec: number,
    opts?: AddClipOptions,
  ) => void;
  /** Splits the given clip at the current playhead position, if it falls inside it. */
  splitClipAtPlayhead: (clipId: string) => void;
  deleteClip: (clipId: string) => void;
  moveClip: (clipId: string, newStartSec: number) => void;
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

  addClip: (sourceId, durationSec, opts) =>
    set((state) => {
      const targetTrack = opts?.trackId
        ? state.project.tracks.find((t) => t.id === opts.trackId)
        : state.project.tracks.find((t) => t.kind === "video");
      if (!targetTrack) return state;

      const lastClipEnd = targetTrack.clips.reduce(
        (max, clip) => Math.max(max, clipEndSec(clip)),
        0,
      );
      const startSec = opts?.startSec ?? lastClipEnd;

      const updatedTrack = insertClip(targetTrack, {
        sourceId,
        startSec,
        inPointSec: 0,
        outPointSec: durationSec,
      });
      const newClip = updatedTrack.clips.find(
        (c) => !targetTrack.clips.some((old) => old.id === c.id),
      );

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === targetTrack.id ? updatedTrack : track,
          ),
        },
        selectedClipId: newClip?.id ?? state.selectedClipId,
      };
    }),

  splitClipAtPlayhead: (clipId) =>
    set((state) => {
      let newRightId: string | null = null;

      const tracks = state.project.tracks.map((track) => {
        const clip = track.clips.find((c) => c.id === clipId);
        if (!clip) return track;

        const result = splitClip(clip, state.playheadSec);
        if (!result) return track;

        const [left, right] = result;
        newRightId = right.id;

        return {
          ...track,
          clips: track.clips
            .map((c) => (c.id === clipId ? left : c))
            .concat(right)
            .sort((a, b) => a.startSec - b.startSec),
        };
      });

      if (!newRightId) return state;

      return {
        project: { ...state.project, tracks },
        selectedClipId: newRightId,
      };
    }),

  deleteClip: (clipId) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) =>
          track.clips.some((c) => c.id === clipId)
            ? deleteClipOp(track, clipId)
            : track,
        ),
      },
      selectedClipId:
        state.selectedClipId === clipId ? null : state.selectedClipId,
    })),

  moveClip: (clipId, newStartSec) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) =>
          track.clips.some((c) => c.id === clipId)
            ? moveClipWithinTrack(track, clipId, newStartSec)
            : track,
        ),
      },
    })),
}));
