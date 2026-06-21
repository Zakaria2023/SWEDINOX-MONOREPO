"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";

type UploadedFile = { documentId: string; fileName: string };

type DocumentUploaderProps = {
  onSuccess?: (uploads: UploadedFile[]) => void;
};

export const DocumentUploader = ({ onSuccess }: DocumentUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList) => {
    setIsUploading(true);
    setError(null);

    try {
      const results = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error ?? `Upload failed (${response.status})`);
          }

          return response.json() as Promise<{ documentId: string; fileName: string }>;
        }),
      );

      onSuccess?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        disabled={isUploading}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
        }}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        {isUploading ? (
          <Upload className="h-4 w-4 animate-bounce" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        {isUploading ? "Uploading…" : "Attach file"}
      </button>
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <X className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
