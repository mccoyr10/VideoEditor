import { useRef, useState } from "react";
import clsx from "clsx";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
}

export function FileDropZone({ onFiles }: FileDropZoneProps) {
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
        if (e.dataTransfer.files.length > 0) onFiles([...e.dataTransfer.files]);
      }}
    >
      <p>Drop video, audio, or image files here, or click to choose</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.currentTarget.files?.length) onFiles([...e.currentTarget.files]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
