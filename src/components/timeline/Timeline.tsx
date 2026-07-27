import { useEffect, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTimelineStore } from "../../timeline/store/timelineStore";
import { useMediaStore } from "../../media/mediaStore";
import { allClips, totalDurationSec } from "../../timeline/model/selectors";
import { clipEndSec, type TrackKind } from "../../timeline/model/types";
import { PIXELS_PER_SECOND, TRACK_LABEL_WIDTH_PX } from "../../timeline/constants";
import { TimelineRuler } from "./TimelineRuler";
import { Track } from "./Track";
import { Playhead } from "./Playhead";

interface TimelineProps {
  onImportFiles: (files: File[]) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

export function Timeline({ onImportFiles }: TimelineProps) {
  const project = useTimelineStore((s) => s.project);
  const playheadSec = useTimelineStore((s) => s.playheadSec);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const splitClipAtPlayhead = useTimelineStore((s) => s.splitClipAtPlayhead);
  const deleteClip = useTimelineStore((s) => s.deleteClip);
  const moveClip = useTimelineStore((s) => s.moveClip);
  const addTrack = useTimelineStore((s) => s.addTrack);
  const sources = useMediaStore((s) => s.sources);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedClip = allClips(project).find((c) => c.id === selectedClipId);

  const canSplit =
    !!selectedClip &&
    playheadSec > selectedClip.startSec &&
    playheadSec < clipEndSec(selectedClip);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const clip = allClips(project).find((c) => c.id === event.active.id);
    if (!clip) return;
    const deltaSec = event.delta.x / PIXELS_PER_SECOND;
    const targetTrackId = (event.over?.id as string | undefined) ?? clip.trackId;
    moveClip(clip.id, targetTrackId, clip.startSec + deltaSec);
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || !selectedClipId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteClip(selectedClipId);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        splitClipAtPlayhead(selectedClipId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedClipId, deleteClip, splitClipAtPlayhead]);

  const durationSec = Math.max(5, totalDurationSec(project));
  const contentWidthPx = durationSec * PIXELS_PER_SECOND;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-neutral-700 px-2 py-1 hover:bg-neutral-600"
        >
          + Add clip
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.currentTarget.files?.length) onImportFiles([...e.currentTarget.files]);
            e.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          disabled={!canSplit}
          onClick={() => selectedClipId && splitClipAtPlayhead(selectedClipId)}
          className="rounded bg-neutral-700 px-2 py-1 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Split at playhead (S)
        </button>
        <button
          type="button"
          disabled={!selectedClipId}
          onClick={() => selectedClipId && deleteClip(selectedClipId)}
          className="rounded bg-neutral-700 px-2 py-1 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete (Del)
        </button>
        <select
          defaultValue=""
          onChange={(e) => {
            const kind = e.currentTarget.value as TrackKind | "";
            if (kind) addTrack(kind);
            e.currentTarget.value = "";
          }}
          className="rounded bg-neutral-700 px-2 py-1 hover:bg-neutral-600"
        >
          <option value="" disabled>
            + Add track
          </option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="overlay">Overlay</option>
        </select>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative w-fit min-w-full">
          <div className="flex">
            <div
              className="shrink-0 border-r border-b border-neutral-800"
              style={{ width: TRACK_LABEL_WIDTH_PX }}
            />
            <TimelineRuler durationSec={durationSec} />
          </div>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="relative">
              {project.tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
                  widthPx={contentWidthPx}
                  sourceDurationSec={(sourceId) => sources[sourceId]?.durationSec ?? 0}
                  selectedClipId={selectedClipId}
                  onSelectClip={selectClip}
                />
              ))}
              <Playhead positionSec={playheadSec} />
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
