import clsx from "clsx";
import { useTimelineStore } from "../../timeline/store/timelineStore";
import { clipEndSec, type Clip } from "../../timeline/model/types";
import { PIXELS_PER_SECOND } from "../../timeline/constants";

const DEFAULT_TRANSITION_DURATION_SEC = 0.5;

interface TransitionHandleProps {
  left: Clip;
  right: Clip;
}

/**
 * A small toggle rendered at the boundary between two adjacent clips:
 * click to add a fixed-duration crossfade, click again to remove it.
 * Only rendered where Track.tsx has already confirmed the pair is
 * eligible (canSetTransition).
 */
export function TransitionHandle({ left, right }: TransitionHandleProps) {
  const setTransition = useTimelineStore((s) => s.setTransition);
  const hasTransition = !!left.transitionOut;

  const boundarySec = (right.startSec + clipEndSec(left)) / 2;

  return (
    <button
      type="button"
      aria-label={hasTransition ? "Remove crossfade transition" : "Add crossfade transition"}
      title={hasTransition ? "Crossfade — click to remove" : "Click to add a crossfade"}
      onClick={(e) => {
        e.stopPropagation();
        setTransition(
          left.id,
          right.id,
          hasTransition
            ? null
            : { type: "crossfade", durationSec: DEFAULT_TRANSITION_DURATION_SEC },
        );
      }}
      className={clsx(
        "absolute top-1/2 z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] leading-none",
        hasTransition
          ? "bg-purple-500 text-white hover:bg-purple-400"
          : "bg-neutral-600 text-neutral-300 hover:bg-neutral-500",
      )}
      style={{ left: boundarySec * PIXELS_PER_SECOND }}
    >
      {hasTransition ? "◆" : "+"}
    </button>
  );
}
