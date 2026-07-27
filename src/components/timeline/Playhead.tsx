import { PIXELS_PER_SECOND } from "../../timeline/constants";

interface PlayheadProps {
  positionSec: number;
}

export function Playhead({ positionSec }: PlayheadProps) {
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 w-px bg-red-500"
      style={{ left: positionSec * PIXELS_PER_SECOND }}
    >
      <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-red-500" />
    </div>
  );
}
