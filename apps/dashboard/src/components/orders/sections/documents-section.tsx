"use client";

import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { DocumentUploader } from "@/components/document-uploader";

export const DocumentsSection = () => {
  const { watch, setValue } = useFormContext<OrderFormValues>();
  const documents = watch("documents");

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Documents</h2>
      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {documents.map((doc, index) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="flex-1 truncate">{doc.fileName}</span>
            <button
              type="button"
              onClick={async () => {
                await fetch(`/api/documents/${doc.id}/delete`, {
                  method: "DELETE",
                });
                setValue(
                  "documents",
                  documents.filter((_, i) => i !== index),
                );
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Remove document"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <DocumentUploader
          onSuccess={(uploads) => {
            setValue("documents", [
              ...documents,
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
