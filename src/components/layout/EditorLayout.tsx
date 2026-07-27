import type { ReactNode } from "react";

interface EditorLayoutProps {
  preview: ReactNode;
  timeline: ReactNode;
  exportBar: ReactNode;
}

export function EditorLayout({ preview, timeline, exportBar }: EditorLayoutProps) {
  return (
    <div className="flex h-screen flex-col gap-3 bg-neutral-950 p-4 text-neutral-100">
      <header className="text-sm font-medium text-neutral-400">video-editor</header>
      <div className="min-h-0 flex-1">{preview}</div>
      <div className="h-72 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-2">
        {timeline}
      </div>
      {exportBar}
    </div>
  );
}
