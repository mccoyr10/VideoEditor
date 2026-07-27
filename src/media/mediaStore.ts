import { create } from "zustand";

interface SourceMediaBase {
  id: string;
  file: File;
  objectUrl: string;
  durationSec: number;
}

export interface VideoSource extends SourceMediaBase {
  kind: "video";
  width: number;
  height: number;
}

export interface AudioSource extends SourceMediaBase {
  kind: "audio";
}

export interface ImageSource extends SourceMediaBase {
  kind: "image";
  width: number;
  height: number;
}

export type SourceMedia = VideoSource | AudioSource | ImageSource;

interface MediaState {
  sources: Record<string, SourceMedia>;
  addSource: (source: SourceMedia) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  sources: {},
  addSource: (source) =>
    set((state) => ({
      sources: { ...state.sources, [source.id]: source },
    })),
}));
