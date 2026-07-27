export interface TrimCommandParams {
  inputFileName: string;
  outputFileName: string;
  inPointSec: number;
  outPointSec: number;
}

/**
 * Pure translation from trim points to ffmpeg args: a stream-copy trim
 * (`-c copy`, no re-encode) for the MVP. This is the seam that later swaps
 * in a multi-clip concat / filter-graph builder, or a server-side renderer,
 * without touching the timeline or preview code.
 */
export function buildTrimCommand(params: TrimCommandParams): string[] {
  return [
    "-i",
    params.inputFileName,
    "-ss",
    params.inPointSec.toFixed(3),
    "-to",
    params.outPointSec.toFixed(3),
    "-c",
    "copy",
    params.outputFileName,
  ];
}
