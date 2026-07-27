import { create } from "zustand";

export interface SourceMedia {
  id: string;
  file: File;
  objectUrl: string;
  durationSec: number;
  width: number;
  height: number;
}

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
