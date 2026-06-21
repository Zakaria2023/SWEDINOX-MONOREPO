"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";

type DocumentUploaderProps = {
  onSuccess?: (documentId: string, fileName: string) => void;
};

export const DocumentUploader = ({ onSuccess }: DocumentUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
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

      const { documentId, fileName } = await response.json();
      onSuccess?.(documentId, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        disabled={isUploading}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadDocument(file);
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
