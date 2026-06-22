"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PhotoDropzone({
  value,
  onChange,
  label,
  className,
  endpoint = "/api/upload",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  endpoint?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur lors de l'envoi de la photo");
      return;
    }

    onChange(data.url);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "relative flex h-32 w-32 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed text-center text-xs text-muted-foreground transition-colors",
        dragging && "border-primary bg-primary/5",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label ?? "Photo"} className="h-full w-full object-cover" />
      ) : uploading ? (
        <span>Envoi...</span>
      ) : (
        <span className="px-2">Glisser une photo ou cliquer</span>
      )}
    </div>
  );
}
