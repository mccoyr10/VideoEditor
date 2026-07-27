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

  const handleFile = useCallback(
    async (file: File) => {
      const source = await importMedia(file);
      addSource(source);
      addClip(source.id, source.durationSec);
    },
    [addSource, addClip],
  );

  const clip = project.tracks[0]?.clips[0] ?? null;
  const source = clip ? sources[clip.sourceId] : null;

  return (
    <EditorLayout
      preview={clip ? <PreviewPlayer /> : <FileDropZone onFile={handleFile} />}
      timeline={<Timeline />}
      exportBar={<ExportDialog clip={clip} source={source ?? null} />}
    />
  );
}

export default App;
