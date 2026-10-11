"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { ReturnOrderFormValues } from "@/app/(dashboard)/return-orders/validation";
import { DocumentUploader } from "@/components/document-uploader";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

/** The `Documents` panel: files attached to the return, saved with it. */
export const DocumentsSection = () => {
  const { watch, setValue } = useFormContext<ReturnOrderFormValues>();
  const documents = watch("documents") ?? [];

  return (
    <CollapsibleSection
      title="Documents"
      summary={`${documents.length} Documents`}
    >
      <div className="space-y-2 p-3">
        {documents.map((doc, index) => (
          <div key={doc.id} className="flex items-center gap-3 text-sm">
            <Link
              href={`/api/documents/${doc.id}/download`}
              className="flex-1 text-primary hover:underline"
            >
              {doc.fileName}
            </Link>
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
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${doc.fileName}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <DocumentUploader
          onSuccess={(uploads) => {
            setValue("documents", [
              ...(watch("documents") ?? []),
              ...uploads.map((u) => ({
                id: u.documentId,
                fileName: u.fileName,
              })),
            ]);
          }}
        />
      </div>
    </CollapsibleSection>
  );
};
