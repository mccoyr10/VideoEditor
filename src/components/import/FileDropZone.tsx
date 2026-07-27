import { useRef, useState } from "react";
import clsx from "clsx";

interface FileDropZoneProps {
  onFile: (file: File) => void;
}

export function FileDropZone({ onFile }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={clsx(
        "flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm transition-colors",
        isDragOver
          ? "border-blue-400 bg-blue-950/30 text-blue-300"
          : "border-neutral-700 text-neutral-500 hover:border-neutral-500",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <p>Drop a video file here, or click to choose one</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
