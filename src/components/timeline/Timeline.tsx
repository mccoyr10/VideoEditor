import { useTimelineStore } from "../../timeline/store/timelineStore";
import { useMediaStore } from "../../media/mediaStore";
import { totalDurationSec } from "../../timeline/model/selectors";
import { TimelineRuler } from "./TimelineRuler";
import { Track } from "./Track";
import { Playhead } from "./Playhead";

export function Timeline() {
  const project = useTimelineStore((s) => s.project);
  const playheadSec = useTimelineStore((s) => s.playheadSec);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const sources = useMediaStore((s) => s.sources);

  const durationSec = Math.max(5, totalDurationSec(project));

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="relative w-fit min-w-full">
        <TimelineRuler durationSec={durationSec} />
        <div className="relative">
          {project.tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              sourceDurationSec={(sourceId) => sources[sourceId]?.durationSec ?? 0}
              selectedClipId={selectedClipId}
              onSelectClip={selectClip}
            />
          ))}
          <Playhead positionSec={playheadSec} />
        </div>
      </div>
    </div>
  );
}
