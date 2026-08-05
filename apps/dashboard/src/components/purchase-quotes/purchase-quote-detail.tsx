"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  convertPurchaseQuoteToOrder,
  PurchaseQuoteDetail,
  recordPurchaseQuotePrices,
} from "@/app/(dashboard)/purchase-quotes/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { PurchaseQuoteStatus } from "@/lib/enums";
import { formatMoney, isPurchaseQuoteEditable } from "@/lib/helpers";
import { PURCHASE_QUOTE_STATUS_LABELS } from "@/lib/labels";
import { Check, Save } from "lucide-react";

type Props = {
  quote: PurchaseQuoteDetail;
};

export const PurchaseQuoteDetailView = ({ quote }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      quote.items.map((item) => [item.uuid, item.netPrice ?? "0.00"]),
    ),
  );

  const isDecided = !isPurchaseQuoteEditable(quote.status);

  const savePrices = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await recordPurchaseQuotePrices(
        quote.uuid,
        quote.items.map((item) => ({
          itemUuid: item.uuid,
          netPrice: prices[item.uuid] ?? "0.00",
        })),
      );
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const award = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await convertPurchaseQuoteToOrder(quote.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsAwardOpen(false);
    });
  };

  // What the quote comes to at the prices currently on screen, so the effect of
  // a change is visible before it is saved.
  const previewTotal = quote.items.reduce(
    (total, item) =>
      total + Number(prices[item.uuid] ?? 0) * Number(item.quantity ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Supplier
          </p>
          <p className="text-sm">{quote.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">
            {PURCHASE_QUOTE_STATUS_LABELS[
              quote.status as PurchaseQuoteStatus
            ] ?? quote.status}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Total excl. VAT
          </p>
          <p className="text-sm tabular-nums">
            {formatMoney(Number(quote.totalExclVat ?? 0))}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Weight
          </p>
          <p className="text-sm tabular-nums">
            {quote.totalWeightKg ?? "0.00"} kg
          </p>
        </div>
      </div>

      {quote.purchaseRequestUuid && (
        <p className="text-sm text-muted-foreground">
          Quoted against{" "}
          <Link
            href={`/purchase-requests/${quote.purchaseRequestUuid}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            its purchase request
          </Link>
          , alongside the other suppliers asked.
        </p>
      )}

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Quoted lines
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="w-36 text-right">Net price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    This quote has no lines.
                  </TableCell>
                </TableRow>
              ) : (
                quote.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell>{item.lineNumber ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ") ||
                        item.description ||
                        "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell>{item.unit ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right"
                        value={prices[item.uuid] ?? ""}
                        onChange={(event) =>
                          setPrices((prev) => ({
                            ...prev,
                            [item.uuid]: event.target.value,
                          }))
                        }
                        disabled={isPending || isDecided}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(
                        Number(prices[item.uuid] ?? 0) *
                          Number(item.quantity ?? 0),
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {quote.items.length > 0 && (
          <p className="text-right text-sm text-muted-foreground">
            At the prices shown:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatMoney(previewTotal)}
            </span>
          </p>
        )}
      </div>

      {!isDecided && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/purchase-quotes/${quote.uuid}/edit`} />}
          >
            Edit Quote
          </Button>
        </div>
      )}

      {!isDecided && quote.items.length > 0 && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={savePrices} disabled={isPending}>
            <Save className="mr-1.5 size-4" />
            {isPending ? "Saving..." : "Save supplier prices"}
          </Button>
          <Button
            type="button"
            onClick={() => setIsAwardOpen(true)}
            disabled={isPending}
          >
            <Check className="mr-1.5 size-4" />
            Award &amp; create purchase order
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={isAwardOpen}
        onOpenChange={setIsAwardOpen}
        onConfirm={award}
        isPending={isPending}
        title="Award this quote"
        description="This creates a purchase order at these prices and marks the other quotes for this request as lost. The price agreed here is what received stock will be valued at, so it drives the margin on everything sold from it."
        confirmLabel="Award"
      />
    </div>
  );
};
