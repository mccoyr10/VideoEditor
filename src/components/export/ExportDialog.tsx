import { useExport } from "../../export/useExport";
import type { Clip } from "../../timeline/model/types";
import type { SourceMedia } from "../../media/mediaStore";

interface ExportDialogProps {
  clip: Clip | null;
  source: SourceMedia | null;
}

export function ExportDialog({ clip, source }: ExportDialogProps) {
  const { status, progress, error, resultUrl, exportClip } = useExport();

  const disabled = !clip || !source || status === "loading" || status === "running";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => clip && source && exportClip(clip, source)}
        className="rounded bg-emerald-700 px-3 py-1 text-sm text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export trimmed clip
      </button>

      {status === "loading" && (
        <span className="text-xs text-neutral-400">Loading ffmpeg…</span>
      )}
      {status === "running" && (
        <span className="text-xs text-neutral-400">
          Exporting… {Math.round(progress * 100)}%
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
