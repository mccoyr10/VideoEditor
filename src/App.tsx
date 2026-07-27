import { useCallback, useState } from "react";
import { EditorLayout } from "./components/layout/EditorLayout";
import { FileDropZone } from "./components/import/FileDropZone";
import { PreviewPlayer } from "./preview/PreviewPlayer";
import { Timeline } from "./components/timeline/Timeline";
import { ExportDialog } from "./components/export/ExportDialog";
import { importMedia } from "./media/importMedia";
import { useMediaStore } from "./media/mediaStore";
import { useTimelineStore } from "./timeline/store/timelineStore";
import { allClips } from "./timeline/model/selectors";
import { canAddSourceKindToTrack } from "./timeline/model/trackCompatibility";

function App() {
  const addSource = useMediaStore((s) => s.addSource);
  const sources = useMediaStore((s) => s.sources);
  const addClip = useTimelineStore((s) => s.addClip);
  const project = useTimelineStore((s) => s.project);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const [importWarning, setImportWarning] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const skipped: string[] = [];
      // Sequential: each addClip appends after whatever's already on its
      // track, so later imports in the same drop must see earlier ones.
      for (const file of files) {
        const source = await importMedia(file);
        const hasMatchingTrack = project.tracks.some((t) =>
          canAddSourceKindToTrack(t.kind, source.kind),
        );
        if (!hasMatchingTrack) {
          skipped.push(file.name);
          continue;
        }
        addSource(source);
        addClip(source);
      }
      setImportWarning(
        skipped.length > 0
          ? `Couldn't add ${skipped.join(", ")} — no matching track (add a ${
              skipped.length === 1 ? "" : "matching "
            }track first via "+ Add track").`
          : null,
      );
    },
    [addSource, addClip, project.tracks],
  );

  const videoTrack = project.tracks.find((t) => t.kind === "video");
  const hasVideoClips = (videoTrack?.clips.length ?? 0) > 0;
  const selectedClip =
    allClips(project).find((c) => c.id === selectedClipId) ?? null;
  const selectedSource = selectedClip ? sources[selectedClip.sourceId] : null;

  return (
    <EditorLayout
      preview={
        hasVideoClips ? <PreviewPlayer /> : <FileDropZone onFiles={handleFiles} />
      }
      timeline={<Timeline onImportFiles={handleFiles} />}
      exportBar={
        <div className="flex flex-col gap-2">
          {importWarning && (
            <div className="rounded border border-amber-800 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-300">
              {importWarning}
            </div>
          )}
          <ExportDialog clip={selectedClip} source={selectedSource ?? null} />
        </div>
      }
    />
  );
}

export default App;
