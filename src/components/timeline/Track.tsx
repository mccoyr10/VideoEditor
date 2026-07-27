import type { Track as TrackModel } from "../../timeline/model/types";
import { ClipItem } from "./ClipItem";

interface TrackProps {
  track: TrackModel;
  sourceDurationSec: (sourceId: string) => number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
}

export function Track({
  track,
  sourceDurationSec,
  selectedClipId,
  onSelectClip,
}: TrackProps) {
  return (
    <div className="relative h-14 border-b border-neutral-800">
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
  );
}
