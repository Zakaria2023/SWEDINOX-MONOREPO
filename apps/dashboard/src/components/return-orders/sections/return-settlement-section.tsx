"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PackageCheck, ReceiptText } from "lucide-react";
import {
  creditReturnOrder,
  receiveReturnOrder,
  ReturnOrderDetail,
} from "@/app/(dashboard)/return-orders/actions";
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
import { formatDateColumn, formatMoney, formatNumber, orDash } from "@/lib/helpers";

type Props = {
  returnOrder: ReturnOrderDetail;
};

export const ReturnSettlementSection = ({ returnOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const isReceived = returnOrder.status === "received";
  const isCredited = returnOrder.status === "credited";
  const isCancelled = returnOrder.status === "cancelled";

  const creditedTotal = returnOrder.credits.reduce(
    (total, credit) => total + Number(credit.invoiceTotal ?? 0),
    0,
  );

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {error && <FormError>{error}</FormError>}

      {!isCancelled && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          {/* Goods arriving and money going back are two decisions, so they
              are two buttons — the second only opens once the first is done. */}
          <Button
            type="button"
            onClick={() => run(() => receiveReturnOrder(returnOrder.uuid))}
            disabled={isPending || isReceived || isCredited}
          >
            <PackageCheck className="size-4" />
            {isReceived || isCredited ? "Goods received" : "Receive goods"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => run(() => creditReturnOrder(returnOrder.uuid))}
            disabled={isPending || !isReceived}
          >
            <ReceiptText className="size-4" />
            {isCredited ? "Credited" : "Raise credit note"}
          </Button>

          <p className="text-sm text-muted-foreground">
            {isCredited
              ? `Credited back to the customer: ${formatMoney(Math.abs(creditedTotal))}.`
              : isReceived
                ? "Back in stock. Raising the credit note hands the money back and frees the customer's credit space."
                : "Receiving books the goods back into stock at the value they left at."}
          </p>
        </div>
      )}

      <CollapsibleSection
        title="Invoice lines"
        summary={
          returnOrder.invoiceLines.length === 0
            ? "Nothing invoiced"
            : `${returnOrder.invoiceLines.length} invoiced line(s)`
        }
      >
        {returnOrder.invoiceLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None of these lines have been invoiced, so there is nothing to
            credit against.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Invoiced</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.invoiceLines.map((line) => (
                  <TableRow key={line.returnOrderItemUuid}>
                    <TableCell>
                      <Link
                        href={`/invoices/${line.invoiceUuid}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {line.invoiceId ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateColumn(line.invoiceDate)}</TableCell>
                    <TableCell>
                      {orDash(line.productCode)} — {orDash(line.productName)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.invoicedQuantity))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(line.netPrice ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(line.amount ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Credits"
        summary={
          returnOrder.credits.length === 0
            ? "Not credited"
            : `${formatMoney(Math.abs(creditedTotal))} credited`
        }
      >
        {returnOrder.credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No credit note has been raised for this return yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Excl. VAT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.credits.map((credit) => (
                  <TableRow key={credit.uuid}>
                    <TableCell>
                      <Link
                        href={`/invoices/${credit.uuid}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {credit.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatDateColumn(credit.invoiceDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(credit.invoiceAmountExclVat))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(credit.invoiceTotal))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(credit.outstanding))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CollapsibleSection>
    </>
  );
};
