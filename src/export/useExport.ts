import { useCallback, useEffect, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg, onFFmpegProgress } from "./ffmpegClient";
import { buildTrimCommand } from "./buildCommand";
import type { Clip } from "../timeline/model/types";
import type { SourceMedia } from "../media/mediaStore";

type ExportStatus = "idle" | "loading" | "running" | "done" | "error";

interface ExportState {
  status: ExportStatus;
  progress: number;
  error: string | null;
  resultUrl: string | null;
}

const idleState: ExportState = {
  status: "idle",
  progress: 0,
  error: null,
  resultUrl: null,
};

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx) : ".mp4";
}

export function useExport() {
  const [state, setState] = useState<ExportState>(idleState);

  useEffect(() => {
    onFFmpegProgress((progress) =>
      setState((s) => (s.status === "running" ? { ...s, progress } : s)),
    );
    return () => onFFmpegProgress(null);
  }, []);

  const exportClip = useCallback(async (clip: Clip, source: SourceMedia) => {
    setState({ status: "loading", progress: 0, error: null, resultUrl: null });
    try {
      const ffmpeg = await getFFmpeg();
      const inputFileName = `input${extensionOf(source.file.name)}`;
      const outputFileName = "output.mp4";

      await ffmpeg.writeFile(inputFileName, await fetchFile(source.file));

      setState((s) => ({ ...s, status: "running" }));
      const args = buildTrimCommand({
        inputFileName,
        outputFileName,
        inPointSec: clip.inPointSec,
        outPointSec: clip.outPointSec,
      });
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data as BlobPart], { type: "video/mp4" });
      const resultUrl = URL.createObjectURL(blob);

      setState({ status: "done", progress: 1, error: null, resultUrl });
    } catch (err) {
      setState({
        status: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Export failed",
        resultUrl: null,
      });
    }
  }, []);

  const reset = useCallback(() => setState(idleState), []);

  return { ...state, exportClip, reset };
}
