import { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Clip } from "../../timeline/model/types";
import { clipDurationSec } from "../../timeline/model/types";
import { useTimelineStore } from "../../timeline/store/timelineStore";
import { PIXELS_PER_SECOND } from "../../timeline/constants";

interface ClipItemProps {
  clip: Clip;
  sourceDurationSec: number;
  isSelected: boolean;
  onSelect: () => void;
}

type TrimHandle = "left" | "right";

export function ClipItem({
  clip,
  sourceDurationSec,
  isSelected,
  onSelect,
}: ClipItemProps) {
  const trim = useTimelineStore((s) => s.trim);
  const deleteClip = useTimelineStore((s) => s.deleteClip);
  const dragState = useRef<{
    handle: TrimHandle;
    startX: number;
    startInPointSec: number;
    startOutPointSec: number;
  } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: clip.id });

  const startTrimDrag = (handle: TrimHandle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      handle,
      startX: e.clientX,
      startInPointSec: clip.inPointSec,
      startOutPointSec: clip.outPointSec,
    };
  };

  const onTrimDrag = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const deltaSec = (e.clientX - drag.startX) / PIXELS_PER_SECOND;

    if (drag.handle === "left") {
      trim(clip.id, { inPointSec: drag.startInPointSec + deltaSec }, sourceDurationSec);
    } else {
      trim(clip.id, { outPointSec: drag.startOutPointSec + deltaSec }, sourceDurationSec);
    }
  };

  const endTrimDrag = () => {
    dragState.current = null;
  };

  const width = clipDurationSec(clip) * PIXELS_PER_SECOND;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "absolute top-1 bottom-1 flex items-center rounded bg-blue-900/70 ring-1",
        isSelected ? "ring-blue-400" : "ring-blue-800",
        isDragging && "opacity-70",
      )}
      style={{
        left: clip.startSec * PIXELS_PER_SECOND,
        width,
        transform: CSS.Translate.toString(transform),
      }}
      onClick={onSelect}
    >
      <div
        className="h-full w-2 shrink-0 cursor-ew-resize rounded-l bg-blue-500/80"
        onPointerDown={startTrimDrag("left")}
        onPointerMove={onTrimDrag}
        onPointerUp={endTrimDrag}
      />
      <span
        className="flex-1 cursor-grab truncate px-2 text-xs text-blue-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        clip
      </span>
      {isSelected && (
        <button
          type="button"
          aria-label="Delete clip"
          onClick={(e) => {
            e.stopPropagation();
            deleteClip(clip.id);
          }}
          className="mr-1 shrink-0 rounded bg-neutral-950/60 px-1.5 text-xs text-red-300 hover:bg-red-900/60"
        >
          ×
        </button>
      )}
      <div
        className="h-full w-2 shrink-0 cursor-ew-resize rounded-r bg-blue-500/80"
        onPointerDown={startTrimDrag("right")}
        onPointerMove={onTrimDrag}
        onPointerUp={endTrimDrag}
      />
    </div>
  );
}
