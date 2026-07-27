import type { Clip } from "../model/types";

/**
 * Returns a new clip with its in/out points adjusted, clamped so that
 * inPoint stays below outPoint and both stay within [0, sourceDurationSec].
 */
export function trimClip(
  clip: Clip,
  next: { inPointSec?: number; outPointSec?: number },
  sourceDurationSec: number,
): Clip {
  const minGap = 1 / 30; // avoid a zero/negative-length clip
  let inPointSec = next.inPointSec ?? clip.inPointSec;
  let outPointSec = next.outPointSec ?? clip.outPointSec;

  inPointSec = Math.max(0, Math.min(inPointSec, sourceDurationSec));
  outPointSec = Math.max(0, Math.min(outPointSec, sourceDurationSec));

  if (inPointSec > outPointSec - minGap) {
    if (next.inPointSec !== undefined) {
      inPointSec = Math.max(0, outPointSec - minGap);
    } else {
      outPointSec = Math.min(sourceDurationSec, inPointSec + minGap);
    }
  }

  return { ...clip, inPointSec, outPointSec };
}
