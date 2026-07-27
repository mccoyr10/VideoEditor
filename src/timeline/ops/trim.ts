import { clipDurationSec, type Clip } from "../model/types";

const minGap = 1 / 30; // avoid a zero/negative-length clip

/**
 * Returns a new clip with its in/out points adjusted, clamped so that
 * inPoint stays below outPoint and both stay within [0, sourceDurationSec].
 * Also clamps any transitionIn/transitionOut duration down to fit the
 * clip's new (possibly shorter) length, rather than leaving a transition
 * that's now longer than the clip itself.
 */
export function trimClip(
  clip: Clip,
  next: { inPointSec?: number; outPointSec?: number },
  sourceDurationSec: number,
): Clip {
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

  const trimmed = { ...clip, inPointSec, outPointSec };
  const maxTransitionSec = Math.max(0, clipDurationSec(trimmed) - minGap);

  return {
    ...trimmed,
    transitionIn: clampTransition(trimmed.transitionIn, maxTransitionSec),
    transitionOut: clampTransition(trimmed.transitionOut, maxTransitionSec),
  };
}

function clampTransition(
  transition: Clip["transitionIn"],
  maxDurationSec: number,
) {
  if (!transition) return transition;
  if (maxDurationSec <= 0) return undefined;
  return transition.durationSec > maxDurationSec
    ? { ...transition, durationSec: maxDurationSec }
    : transition;
}
