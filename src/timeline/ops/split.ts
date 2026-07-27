import { nanoid } from "nanoid";
import { clipEndSec, type Clip } from "../model/types";

const minGap = 1 / 30;

/**
 * Splits a clip at an absolute timeline position into two clips. Returns
 * null if atSec doesn't fall strictly inside the clip (with a minimum gap
 * on either side, so neither half is a zero/negative-length clip).
 *
 * A split invalidates the clip's transition relationships with its old
 * neighbors on the newly-created inner edges, so those are cleared.
 */
export function splitClip(clip: Clip, atSec: number): [Clip, Clip] | null {
  const end = clipEndSec(clip);
  if (atSec <= clip.startSec + minGap || atSec >= end - minGap) {
    return null;
  }

  const sourceSplitSec = clip.inPointSec + (atSec - clip.startSec);

  const left: Clip = {
    ...clip,
    outPointSec: sourceSplitSec,
    transitionOut: undefined,
  };

  const right: Clip = {
    ...clip,
    id: nanoid(),
    startSec: atSec,
    inPointSec: sourceSplitSec,
    transitionIn: undefined,
  };

  return [left, right];
}
