import { PIXELS_PER_SECOND } from "../../timeline/constants";

interface TimelineRulerProps {
  durationSec: number;
}

export function TimelineRuler({ durationSec }: TimelineRulerProps) {
  const tickCount = Math.max(1, Math.ceil(durationSec));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i);

  return (
    <div
      className="relative h-6 border-b border-neutral-800 text-xs text-neutral-500"
      style={{ width: durationSec * PIXELS_PER_SECOND }}
    >
      {ticks.map((sec) => (
        <div
          key={sec}
          className="absolute top-0 h-full border-l border-neutral-800 pl-1"
          style={{ left: sec * PIXELS_PER_SECOND }}
        >
          {sec}s
        </div>
      ))}
    </div>
  );
}
