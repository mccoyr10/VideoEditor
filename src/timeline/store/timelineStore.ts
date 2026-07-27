import { create } from "zustand";
import { createProject, createTrack } from "../model/factories";
import { clipEndSec, type Project, type Transition, type TrackKind } from "../model/types";
import { canAddSourceKindToTrack } from "../model/trackCompatibility";
import { trimClip } from "../ops/trim";
import { insertClip } from "../ops/insert";
import { splitClip } from "../ops/split";
import { deleteClip as deleteClipOp } from "../ops/remove";
import { moveClipWithinTrack, moveClipToTrack } from "../ops/reorder";
import { setTransition as setTransitionOp } from "../ops/transition";
import type { SourceMedia } from "../../media/mediaStore";

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
  /** Appends a clip to a track (default: first track whose kind accepts this source's kind, after its last clip). No-op if no such track exists or the source's kind doesn't fit an explicit target. */
  addClip: (source: SourceMedia, opts?: AddClipOptions) => void;
  /** Splits the given clip at the current playhead position, if it falls inside it. */
  splitClipAtPlayhead: (clipId: string) => void;
  deleteClip: (clipId: string) => void;
  /** Moves a clip to a new position, optionally on a different track. No-op if the clip's kind doesn't fit the target track. */
  moveClip: (clipId: string, targetTrackId: string, newStartSec: number) => void;
  addTrack: (kind: TrackKind) => void;
  /** No-op if the track still has clips on it. */
  removeTrack: (trackId: string) => void;
  setTrackMuted: (trackId: string, muted: boolean) => void;
  setTrackHidden: (trackId: string, hidden: boolean) => void;
  /** Sets/resizes (transition) or clears (null) a crossfade between two adjacent clips on the same track. No-op if they're not on the same track or not adjacent. */
  setTransition: (
    leftClipId: string,
    rightClipId: string,
    transition: Transition | null,
  ) => void;
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

  addClip: (source, opts) =>
    set((state) => {
      // Default target: the first track whose kind actually accepts this
      // source's kind (video -> video track, audio -> audio track, image ->
      // overlay track), not just "the video track" -- otherwise imported
      // audio/images would have nowhere valid to land by default.
      const targetTrack = opts?.trackId
        ? state.project.tracks.find((t) => t.id === opts.trackId)
        : state.project.tracks.find((t) => canAddSourceKindToTrack(t.kind, source.kind));
      if (!targetTrack) return state;
      if (!canAddSourceKindToTrack(targetTrack.kind, source.kind)) return state;

      const lastClipEnd = targetTrack.clips.reduce(
        (max, clip) => Math.max(max, clipEndSec(clip)),
        0,
      );
      const startSec = opts?.startSec ?? lastClipEnd;

      const updatedTrack = insertClip(targetTrack, {
        sourceId: source.id,
        sourceKind: source.kind,
        startSec,
        inPointSec: 0,
        outPointSec: source.durationSec,
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

  moveClip: (clipId, targetTrackId, newStartSec) =>
    set((state) => {
      const sourceTrack = state.project.tracks.find((t) =>
        t.clips.some((c) => c.id === clipId),
      );
      const targetTrack = state.project.tracks.find((t) => t.id === targetTrackId);
      if (!sourceTrack || !targetTrack) return state;

      if (sourceTrack.id === targetTrack.id) {
        return {
          project: {
            ...state.project,
            tracks: state.project.tracks.map((t) =>
              t.id === sourceTrack.id
                ? moveClipWithinTrack(t, clipId, newStartSec)
                : t,
            ),
          },
        };
      }

      const clip = sourceTrack.clips.find((c) => c.id === clipId)!;
      if (!canAddSourceKindToTrack(targetTrack.kind, clip.sourceKind)) return state;

      const result = moveClipToTrack(sourceTrack, targetTrack, clipId, newStartSec);
      if (!result) return state;

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((t) => {
            if (t.id === result.sourceTrack.id) return result.sourceTrack;
            if (t.id === result.targetTrack.id) return result.targetTrack;
            return t;
          }),
        },
      };
    }),

  addTrack: (kind) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: [
          ...state.project.tracks,
          createTrack(kind, state.project.tracks.length),
        ],
      },
    })),

  removeTrack: (trackId) =>
    set((state) => {
      const track = state.project.tracks.find((t) => t.id === trackId);
      if (!track || track.clips.length > 0) return state;
      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.filter((t) => t.id !== trackId),
        },
      };
    }),

  setTrackMuted: (trackId, muted) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted } : t,
        ),
      },
    })),

  setTrackHidden: (trackId, hidden) =>
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, hidden } : t,
        ),
      },
    })),

  setTransition: (leftClipId, rightClipId, transition) =>
    set((state) => {
      const track = state.project.tracks.find(
        (t) =>
          t.clips.some((c) => c.id === leftClipId) &&
          t.clips.some((c) => c.id === rightClipId),
      );
      if (!track) return state;

      const updatedTrack = setTransitionOp(track, leftClipId, rightClipId, transition);

      return {
        project: {
          ...state.project,
          tracks: state.project.tracks.map((t) =>
            t.id === track.id ? updatedTrack : t,
          ),
        },
      };
    }),
}));
