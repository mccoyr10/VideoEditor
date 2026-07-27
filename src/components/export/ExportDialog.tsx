import { useExport } from "../../export/useExport";
import type { Project } from "../../timeline/model/types";
import { allClips } from "../../timeline/model/selectors";
import type { SourceMedia } from "../../media/mediaStore";

interface ExportDialogProps {
  project: Project;
  sources: Record<string, SourceMedia>;
}

export function ExportDialog({ project, sources }: ExportDialogProps) {
  const { status, progress, statusMessage, error, resultUrl, exportProject } =
    useExport();

  const isEmpty = allClips(project).length === 0;
  const isBusy = status === "preparing" || status === "running";
  const disabled = isEmpty || isBusy;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => exportProject(project, sources)}
        className="rounded bg-emerald-700 px-3 py-1 text-sm text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export project
      </button>

      {isBusy && (
        <span className="text-xs text-neutral-400">
          {statusMessage}
          {status === "running" && ` (${Math.round(progress * 100)}%)`}
        </span>
      )}
      {status === "error" && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      {status === "done" && resultUrl && (
        <a
          href={resultUrl}
          download="export.mp4"
          className="text-xs text-emerald-400 underline"
        >
          Download export.mp4
        </a>
      )}
    </div>
  );
}
