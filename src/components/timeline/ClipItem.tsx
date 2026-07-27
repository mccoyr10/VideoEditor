import { useRef } from "react";
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

type DragHandle = "left" | "right";

export function ClipItem({
  clip,
  sourceDurationSec,
  isSelected,
  onSelect,
}: ClipItemProps) {
  const trim = useTimelineStore((s) => s.trim);
  const dragState = useRef<{
    handle: DragHandle;
    startX: number;
    startInPointSec: number;
    startOutPointSec: number;
  } | null>(null);

  const startDrag = (handle: DragHandle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      handle,
      startX: e.clientX,
      startInPointSec: clip.inPointSec,
      startOutPointSec: clip.outPointSec,
    };
  };

  const onDrag = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const deltaSec = (e.clientX - drag.startX) / PIXELS_PER_SECOND;

    if (drag.handle === "left") {
      trim(clip.id, { inPointSec: drag.startInPointSec + deltaSec }, sourceDurationSec);
    } else {
      trim(clip.id, { outPointSec: drag.startOutPointSec + deltaSec }, sourceDurationSec);
    }
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const width = clipDurationSec(clip) * PIXELS_PER_SECOND;

  return (
    <div
      className={clsx(
        "absolute top-1 bottom-1 flex items-center rounded bg-blue-900/70 ring-1",
        isSelected ? "ring-blue-400" : "ring-blue-800",
      )}
      style={{ left: clip.startSec * PIXELS_PER_SECOND, width }}
      onClick={onSelect}
    >
      <div
        className="h-full w-2 shrink-0 cursor-ew-resize rounded-l bg-blue-500/80"
        onPointerDown={startDrag("left")}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
      />
      <span className="flex-1 truncate px-2 text-xs text-blue-100">
        clip
      </span>
      <div
        className="h-full w-2 shrink-0 cursor-ew-resize rounded-r bg-blue-500/80"
        onPointerDown={startDrag("right")}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
      />
    </div>
  );
}
