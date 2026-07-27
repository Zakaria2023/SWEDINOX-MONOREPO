"use client";

import {
  deleteQuote,
  saveQuote,
} from "@/app/(dashboard)/companies/[uuid]/edit/quotes/actions";
import { quoteRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/quotes/mappers";
import {
  DEFAULT_QUOTE,
  quoteDialogSchema,
  QuoteDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { QuoteDialog } from "@/components/companies/dialogs/quote-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectQuotes } from "@/db/schema/quotes";
import { daysInSystem, toDateInput, todayDateString } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  quotes: SelectQuotes[];
};

export const CompanyQuotesEditor = ({ companyUuid, quotes }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectQuotes | null>(null);

  const [saveState, dispatchSave, isSaving] = useActionState(saveQuote, {});
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteQuote,
    {},
  );

  const quoteForm = useForm<QuoteDialogValues>({
    resolver: zodResolver(quoteDialogSchema),
    defaultValues: DEFAULT_QUOTE,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      quoteForm.reset(DEFAULT_QUOTE);
    }
  }, [saveState, quoteForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    // Same default as the legacy add flow: the quote date starts at today.
    quoteForm.reset({ ...DEFAULT_QUOTE, quoteDate: todayDateString() });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (quote: SelectQuotes) => {
    quoteForm.reset(quoteRowToDialogValues(quote));
    setEditingUuid(quote.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      quoteForm.reset(DEFAULT_QUOTE);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = quoteForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, quoteUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, quoteUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {quotes.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No quotes yet — add the first one below.
          </p>
        )}
        {quotes.map((quote) => (
          <div
            key={quote.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0 text-muted-foreground">
                {toDateInput(quote.quoteDate) || "Quote"}
              </span>
              {quote.customerRef && (
                <span className="line-clamp-1 min-w-0 text-muted-foreground">
                  {quote.customerRef}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                € {quote.totalExclVat ?? "0.00"}
              </span>
              {quote.handlingBlocked && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Blocked
                </span>
              )}
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {daysInSystem(quote.createdAt)} days in system
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(quote)}
                className="rounded p-1 text-muted-foreground hover:text-primary"
                disabled={isSaving || isDeleting}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit quote</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(quote)}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete quote</span>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Quote
        </button>
      </div>

      <QuoteDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={quoteForm}
        isEditing={editingUuid !== null}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete quote"
        description={`Delete ${
          deleteTarget && toDateInput(deleteTarget.quoteDate)
            ? `the quote from ${toDateInput(deleteTarget.quoteDate)}`
            : "this quote"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
