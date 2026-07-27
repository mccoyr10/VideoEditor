import { clipDurationSec, clipEndSec, type Clip, type Track, type Transition } from "../model/types";

const minGap = 1 / 30;

/**
 * True if leftClip/rightClip are eligible for setTransition: either
 * exactly cut-adjacent (no transition yet) or already transitioned
 * between exactly this pair (eligible to resize/remove). Shared between
 * the op and the UI, which uses it to decide where to show the
 * transition-toggle affordance.
 */
export function canSetTransition(leftClip: Clip, rightClip: Clip): boolean {
  const existingDuration = leftClip.transitionOut?.durationSec ?? 0;
  return rightClip.startSec === clipEndSec(leftClip) - existingDuration;
}

/**
 * Sets (or clears, with `transition: null`) a crossfade between two
 * timeline-adjacent clips on the same track. The overlap is created by
 * shifting the right clip's startSec left by the transition's duration
 * (using the clips' existing trim points, not extended footage), and
 * every clip after it on the track ripple-shifts by the same amount to
 * stay cut-adjacent outside the transition window — the one place ripple
 * is correct here, since it's the only way to keep the rest of the track
 * consistent.
 *
 * Only proceeds if the pair is currently either exactly cut-adjacent (to
 * create a transition) or already transitioned between exactly this pair
 * (to resize/remove one) — a gap, an unrelated overlap, or a non-adjacent
 * pair is a no-op.
 */
export function setTransition(
  track: Track,
  leftClipId: string,
  rightClipId: string,
  transition: Transition | null,
): Track {
  const leftClip = track.clips.find((c) => c.id === leftClipId);
  const rightClip = track.clips.find((c) => c.id === rightClipId);
  if (!leftClip || !rightClip) return track;
  if (!canSetTransition(leftClip, rightClip)) return track;

  const existingDuration = leftClip.transitionOut?.durationSec ?? 0;
  let newDuration = transition?.durationSec ?? 0;
  if (newDuration > 0) {
    const maxDuration =
      Math.min(clipDurationSec(leftClip), clipDurationSec(rightClip)) - minGap;
    newDuration = Math.min(newDuration, maxDuration);
    if (newDuration < minGap) newDuration = 0;
  }

  const delta = newDuration - existingDuration;
  const appliedTransition = newDuration > 0 ? { ...transition!, durationSec: newDuration } : undefined;

  const clips = track.clips.map((c) => {
    if (c.id === leftClip.id) return { ...c, transitionOut: appliedTransition };
    if (c.id === rightClip.id) {
      return { ...c, startSec: c.startSec - delta, transitionIn: appliedTransition };
    }
    // Ripple every clip after the right clip by the same shift.
    if (c.startSec >= rightClip.startSec) return { ...c, startSec: c.startSec - delta };
    return c;
  });

  return { ...track, clips };
}
