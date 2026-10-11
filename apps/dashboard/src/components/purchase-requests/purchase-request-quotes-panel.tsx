"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Award, Eye, FileQuestion } from "lucide-react";
import {
  awardPurchaseRequestQuote,
  PurchaseRequestDetail,
} from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormError } from "@/components/ui/form-error";
import { purchaseQuoteStatuses } from "@/lib/enums";
import {
  cn,
  formatDateValue,
  formatMoney,
  isPurchaseRequestEditable,
  orDash,
} from "@/lib/helpers";
import { PURCHASE_QUOTE_STATUS_LABELS } from "@/lib/labels";

const QUOTE_COLUMNS = [
  "Quote",
  "Supplier",
  "Status",
  "Quote date",
  "Valid until",
  "Lines",
  "Total excl. VAT",
];

const NUMERIC_COLUMNS = new Set(["Quote", "Lines", "Total excl. VAT"]);

type Props = {
  request: PurchaseRequestDetail;
  /** Opens the `Purchase quote` window, to ask another supplier. */
  onAskSuppliers: () => void;
};

/**
 * The quotes the request was answered with, read against each other: same
 * lines, same terms, different money. A toolbar over the grid acts on the
 * selected quote — `Show` opens it, `Award` makes it the purchase order and
 * marks the others lost.
 */
export const PurchaseRequestQuotesPanel = ({
  request,
  onAskSuppliers,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected =
    request.quotes.find((quote) => quote.uuid === selectedUuid) ?? null;
  const isOpen = isPurchaseRequestEditable(request.status);
  // Only a quote still waiting on a decision can be awarded.
  const canAward =
    isOpen &&
    selected !== null &&
    (selected.status === "open" || selected.status === "received");

  const award = () => {
    if (!selected) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await awardPurchaseRequestQuote(
        request.uuid,
        selected.uuid,
      );
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const statusLabel = (status: string) => {
    const known = purchaseQuoteStatuses.find((value) => value === status);
    return known ? PURCHASE_QUOTE_STATUS_LABELS[known] : status;
  };

  return (
    <CollapsibleSection
      title="Purchase quotes"
      summary={`${request.quotes.length} asked`}
      defaultOpen={request.quotes.length > 0}
    >
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
          {selected ? (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={`/purchase-quotes/${selected.uuid}`} />}
            >
              <Eye className="size-3.5" /> Show
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled>
              <Eye className="size-3.5" /> Show
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={award}
            disabled={isPending || !canAward}
            title="Turns the selected quote into the purchase order, at its prices"
          >
            <Award className="size-3.5" />
            {isPending ? "Awarding…" : "Award"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAskSuppliers}
            disabled={isPending || !isOpen}
          >
            <FileQuestion className="size-3.5" /> Ask suppliers
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {QUOTE_COLUMNS.map((column) => (
                  <TableHead
                    key={column}
                    className={cn(NUMERIC_COLUMNS.has(column) && "text-right")}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.quotes.map((quote) => (
                <TableRow
                  key={quote.uuid}
                  onClick={() => setSelectedUuid(quote.uuid)}
                  className={cn(
                    "cursor-pointer",
                    selectedUuid === quote.uuid && "bg-accent",
                  )}
                >
                  <TableCell className="text-right tabular-nums">
                    {quote.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {orDash(quote.supplierName)}
                  </TableCell>
                  <TableCell>{statusLabel(quote.status)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateValue(quote.quoteDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateValue(quote.validUntil)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {quote.lineCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(quote.totalExclVat ?? 0))}
                  </TableCell>
                </TableRow>
              ))}
              {request.quotes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={QUOTE_COLUMNS.length}
                    className="text-muted-foreground"
                  >
                    No suppliers asked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <FormError>{error}</FormError>
      </div>
    </CollapsibleSection>
  );
};
