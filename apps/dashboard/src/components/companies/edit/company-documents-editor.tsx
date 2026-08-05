"use client";

import {
  addCompanyDocuments,
  CompanyDocumentEntry,
  removeCompanyDocument,
} from "@/app/(dashboard)/companies/[uuid]/edit/documents/actions";
import { DocumentUploader } from "@/components/document-uploader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { RowAction } from "@/components/ui/row-action";

type Props = {
  companyUuid: string;
  documents: CompanyDocumentEntry[];
};

type UploadedFile = {
  documentId: string;
  fileName: string;
};

export const CompanyDocumentsEditor = ({ companyUuid, documents }: Props) => {
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocumentEntry | null>(
    null,
  );
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [addState, dispatchAdd, isAdding] = useActionState(
    addCompanyDocuments,
    {},
  );
  const [removeState, dispatchRemove, isRemoving] = useActionState(
    removeCompanyDocument,
    {},
  );

  useEffect(() => {
    if (removeState.success) {
      setDeleteTarget(null);
    }
  }, [removeState]);

  // The binary upload already happened through the existing
  // /api/documents/upload endpoint (inside DocumentUploader) — this only
  // records the returned entries on the company row.
  const handleUploadSuccess = (uploads: UploadedFile[]) => {
    startTransition(() => {
      dispatchAdd({
        companyUuid,
        documents: uploads.map((upload) => ({
          id: upload.documentId,
          fileName: upload.fileName,
        })),
      });
    });
  };

  // Mirrors the legacy documents section: delete the stored file through the
  // existing endpoint first, then drop the entry from the JSON column.
  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);
    setIsDeletingFile(true);

    try {
      const response = await fetch(`/api/documents/${deleteTarget.id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => ({}));
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : `Delete failed (${response.status})`;
        throw new Error(message);
      }

      const documentId = deleteTarget.id;
      startTransition(() => {
        dispatchRemove({ companyUuid, documentId });
      });
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete document",
      );
    } finally {
      setIsDeletingFile(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormError>
        {addState.error ?? removeState.error ?? deleteError}
      </FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {documents.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No documents yet — attach the first file below.
          </p>
        )}
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <Link
                href={`/api/documents/${document.id}/download?fileName=${encodeURIComponent(document.fileName)}`}
                className="line-clamp-1 underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {document.fileName}
              </Link>
            </div>
            <RowAction
              onClick={() => setDeleteTarget(document)}
              label="Delete document"
              tone="danger"
              disabled={isAdding || isRemoving || isDeletingFile}
            >
              <Trash2 className="size-4" />
            </RowAction>
          </div>
        ))}
        <DocumentUploader onSuccess={handleUploadSuccess} />
        {isAdding && (
          <p className="text-sm text-muted-foreground">Saving documents…</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title="Delete document"
        description={`Delete ${
          deleteTarget ? deleteTarget.fileName : "this document"
        }? The stored file is removed as well. This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeletingFile || isRemoving}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
