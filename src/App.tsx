import { useCallback } from "react";
import { EditorLayout } from "./components/layout/EditorLayout";
import { FileDropZone } from "./components/import/FileDropZone";
import { PreviewPlayer } from "./preview/PreviewPlayer";
import { Timeline } from "./components/timeline/Timeline";
import { ExportDialog } from "./components/export/ExportDialog";
import { importMedia } from "./media/importMedia";
import { useMediaStore } from "./media/mediaStore";
import { useTimelineStore } from "./timeline/store/timelineStore";

function App() {
  const addSource = useMediaStore((s) => s.addSource);
  const sources = useMediaStore((s) => s.sources);
  const addClip = useTimelineStore((s) => s.addClip);
  const project = useTimelineStore((s) => s.project);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);

  const handleFile = useCallback(
    async (file: File) => {
      const source = await importMedia(file);
      addSource(source);
      addClip(source.id, source.durationSec);
    },
    [addSource, addClip],
  );

  const videoTrack = project.tracks.find((t) => t.kind === "video");
  const clips = videoTrack?.clips ?? [];
  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null;
  const selectedSource = selectedClip ? sources[selectedClip.sourceId] : null;

  return (
    <EditorLayout
      preview={
        clips.length > 0 ? <PreviewPlayer /> : <FileDropZone onFile={handleFile} />
      }
      timeline={<Timeline onImport={handleFile} />}
      exportBar={
        <ExportDialog clip={selectedClip} source={selectedSource ?? null} />
      }
    />
  );
}

export default App;
