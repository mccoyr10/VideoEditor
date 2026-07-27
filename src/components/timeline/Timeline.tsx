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
import { clipEndSec } from "../../timeline/model/types";
import { PIXELS_PER_SECOND } from "../../timeline/constants";
import { TimelineRuler } from "./TimelineRuler";
import { Track } from "./Track";
import { Playhead } from "./Playhead";

interface TimelineProps {
  onImport: (file: File) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

export function Timeline({ onImport }: TimelineProps) {
  const project = useTimelineStore((s) => s.project);
  const playheadSec = useTimelineStore((s) => s.playheadSec);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const splitClipAtPlayhead = useTimelineStore((s) => s.splitClipAtPlayhead);
  const deleteClip = useTimelineStore((s) => s.deleteClip);
  const sources = useMediaStore((s) => s.sources);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moveClip = useTimelineStore((s) => s.moveClip);

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

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
    moveClip(clip.id, clip.startSec + deltaSec);
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
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) onImport(file);
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
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative w-fit min-w-full">
          <TimelineRuler durationSec={durationSec} />
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="relative">
              {project.tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
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
