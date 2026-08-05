"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { DocumentUploader } from "@/components/document-uploader";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";

export const DocumentsSection = () => {
  const { watch, setValue } = useFormContext<CompanyFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Documents
      </h2>
      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
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
              <X className="size-4" />
            </button>
          </div>
        ))}
        <DocumentUploader
          onSuccess={(uploads) => {
            const current = watch("documents");
            setValue("documents", [
              ...current,
              ...uploads.map((u) => ({
                id: u.documentId,
                fileName: u.fileName,
              })),
            ]);
          }}
        />
      </div>
    </section>
  );
};
