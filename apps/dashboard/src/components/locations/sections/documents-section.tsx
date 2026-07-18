"use client";

import { useFormContext } from "react-hook-form";
import { LocationFormValues } from "@/app/(dashboard)/locations/validation";
import { DocumentUploader } from "@/components/document-uploader";

export const DocumentsSection = () => {
  const { watch, setValue } = useFormContext<LocationFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Documents
      </h2>
      <div className="space-y-2">
        {watch("documents").map((doc, index) => (
          <div key={doc.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{doc.fileName}</span>
            <button
              type="button"
              onClick={async () => {
                await fetch(`/api/documents/${doc.id}/delete`, {
                  method: "DELETE",
                });
                const current = watch("documents");
                setValue(
                  "documents",
                  current.filter((_, i) => i !== index),
                );
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <DocumentUploader
        onSuccess={(uploads) => {
          const current = watch("documents");
          setValue("documents", [
            ...current,
            ...uploads.map((u) => ({ id: u.documentId, fileName: u.fileName })),
          ]);
        }}
      />
    </section>
  );
};
