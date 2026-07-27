import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import type { Track as TrackModel } from "../../timeline/model/types";
import { useTimelineStore } from "../../timeline/store/timelineStore";
import { ClipItem } from "./ClipItem";

interface TrackProps {
  track: TrackModel;
  widthPx: number;
  sourceDurationSec: (sourceId: string) => number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
}

export function Track({
  track,
  widthPx,
  sourceDurationSec,
  selectedClipId,
  onSelectClip,
}: TrackProps) {
  const removeTrack = useTimelineStore((s) => s.removeTrack);
  const { setNodeRef, isOver } = useDroppable({ id: track.id });

  return (
    <div className="flex border-b border-neutral-800">
      <div className="flex w-20 shrink-0 items-center justify-between gap-1 border-r border-neutral-800 px-2 text-[11px] text-neutral-400">
        <span className="capitalize">{track.kind}</span>
        {track.clips.length === 0 && (
          <button
            type="button"
            aria-label="Remove track"
            onClick={() => removeTrack(track.id)}
            className="text-neutral-600 hover:text-red-400"
          >
            ×
          </button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={clsx("relative h-14", isOver && "bg-blue-500/10")}
        style={{ width: widthPx }}
      >
        {track.clips.map((clip) => (
          <ClipItem
            key={clip.id}
            clip={clip}
            sourceDurationSec={sourceDurationSec(clip.sourceId)}
            isSelected={selectedClipId === clip.id}
            onSelect={() => onSelectClip(clip.id)}
          />
        ))}
      </div>
    </div>
  );
}
