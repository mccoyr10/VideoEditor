import { useCallback, useEffect, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg, onFFmpegProgress } from "./ffmpegClient";
import { buildProjectCommand, OUTPUT_FILE_NAME } from "./buildProjectCommand";
import type { Project } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";

type ExportStatus = "idle" | "preparing" | "running" | "done" | "error";

interface ExportState {
  status: ExportStatus;
  progress: number;
  statusMessage: string | null;
  error: string | null;
  resultUrl: string | null;
}

const idleState: ExportState = {
  status: "idle",
  progress: 0,
  statusMessage: null,
  error: null,
  resultUrl: null,
};

export function useExport() {
  const [state, setState] = useState<ExportState>(idleState);

  useEffect(() => {
    onFFmpegProgress((progress) =>
      setState((s) => (s.status === "running" ? { ...s, progress } : s)),
    );
    return () => onFFmpegProgress(null);
  }, []);

  const exportProject = useCallback(
    async (project: Project, sources: Record<string, SourceMedia>) => {
      setState({
        status: "preparing",
        progress: 0,
        statusMessage: "Loading ffmpeg…",
        error: null,
        resultUrl: null,
      });

      const { args, plannedInputs } = buildProjectCommand(project, sources);

      try {
        const ffmpeg = await getFFmpeg();

        for (let i = 0; i < plannedInputs.length; i++) {
          const input = plannedInputs[i];
          setState((s) => ({
            ...s,
            statusMessage: `Preparing ${i + 1}/${plannedInputs.length} files…`,
          }));
          await ffmpeg.writeFile(input.fileName, await fetchFile(input.source.file));
        }

        setState((s) => ({
          ...s,
          status: "running",
          statusMessage: "Exporting… this may take a while",
        }));
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(OUTPUT_FILE_NAME);
        const blob = new Blob([data as BlobPart], { type: "video/mp4" });
        const resultUrl = URL.createObjectURL(blob);

        // Bound MEMFS growth across repeated exports in one session.
        for (const input of plannedInputs) {
          await ffmpeg.deleteFile(input.fileName).catch(() => {});
        }
        await ffmpeg.deleteFile(OUTPUT_FILE_NAME).catch(() => {});

        setState({
          status: "done",
          progress: 1,
          statusMessage: null,
          error: null,
          resultUrl,
        });
      } catch (err) {
        setState({
          status: "error",
          progress: 0,
          statusMessage: null,
          error: err instanceof Error ? err.message : "Export failed",
          resultUrl: null,
        });
      }
    },
    [],
  );

  const reset = useCallback(() => setState(idleState), []);

  return { ...state, exportProject, reset };
}
