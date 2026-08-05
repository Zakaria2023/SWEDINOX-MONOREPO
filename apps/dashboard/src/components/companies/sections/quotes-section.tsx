"use client";

import { CompanyQuoteInput } from "@/app/(dashboard)/companies/actions";
import { FileText, Pencil, Plus, X } from "lucide-react";

type Props = {
  quotes: CompanyQuoteInput[];
  removeQuote: (index: number) => void;
  handleOpenQuote: () => void;
  handleEditQuote: (index: number) => void;
  isPending: boolean;
};

export const QuotesSection = ({
  quotes,
  removeQuote,
  handleOpenQuote,
  handleEditQuote,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
      Quotes
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {quotes.map((quote, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">
              {quote.quoteDate
                ? new Date(quote.quoteDate).toISOString().split("T")[0]
                : "Quote"}
            </span>
            {quote.customerRef && (
              <span className="min-w-0 truncate text-muted-foreground">
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
              0 days in system
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => handleEditQuote(index)}
              className="text-muted-foreground hover:text-primary"
              disabled={isPending}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit quote</span>
            </button>
            <button
              type="button"
              onClick={() => removeQuote(index)}
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove quote</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenQuote}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Quote
      </button>
    </div>
  </section>
);
