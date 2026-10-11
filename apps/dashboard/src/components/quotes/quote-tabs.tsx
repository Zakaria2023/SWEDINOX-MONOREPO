"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { DocumentUploader } from "@/components/document-uploader";
import { Textarea } from "@/components/shadcn/textarea";
import { FormLabel } from "@/components/ui/form-field";
import { cn } from "@/lib/helpers";

const TABS = ["Texts", "Documents", "PDF files"] as const;

type Tab = (typeof TABS)[number];

type Props = {
  readOnly: boolean;
};

/**
 * The tabs at the foot of the reference's document window: `Texts` (the
 * quote's remarks), `Documents` (files attached to it) and `PDF files` (the
 * printed copies — not kept by this app yet).
 */
export const QuoteTabs = ({ readOnly }: Props) => {
  const { register, control, setValue, getValues } =
    useFormContext<QuoteFormValues>();
  const documents = useWatch({ control, name: "documents" }) ?? [];
  const [tab, setTab] = useState<Tab>("Texts");

  return (
    <section className="overflow-hidden rounded-lg border">
      <div role="tablist" className="flex border-b bg-muted/40">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === name
                ? "border-primary bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name === "Documents" ? `${name} (${documents.length})` : name}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="p-3">
        {tab === "Texts" && (
          <div>
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <Textarea
              id="remarks"
              rows={4}
              placeholder="Additional remarks..."
              disabled={readOnly}
              {...register("remarks")}
            />
          </div>
        )}

        {tab === "Documents" && (
          <div className="space-y-2">
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No documents attached.
              </p>
            )}
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
                  disabled={readOnly}
                  onClick={async () => {
                    await fetch(`/api/documents/${doc.id}/delete`, {
                      method: "DELETE",
                    });
                    setValue(
                      "documents",
                      (getValues("documents") ?? []).filter(
                        (_, at) => at !== index,
                      ),
                      { shouldDirty: true },
                    );
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${doc.fileName}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {!readOnly && (
              <DocumentUploader
                onSuccess={(uploads) =>
                  setValue(
                    "documents",
                    [
                      ...(getValues("documents") ?? []),
                      ...uploads.map((upload) => ({
                        id: upload.documentId,
                        fileName: upload.fileName,
                      })),
                    ],
                    { shouldDirty: true },
                  )
                }
              />
            )}
          </div>
        )}

        {tab === "PDF files" && (
          <p className="text-sm text-muted-foreground">
            No PDF files — printed copies of a quote are not kept yet.
          </p>
        )}
      </div>
    </section>
  );
};
