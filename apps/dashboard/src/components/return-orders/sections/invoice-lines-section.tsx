import Link from "next/link";
import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
} from "@/lib/helpers";

type Props = {
  returnOrder: ReturnOrderDetail;
};

/**
 * The `Invoice lines` panel of a saved return: what each returned line was
 * billed on — the only figure a credit may be based on — and below it the
 * credit notes the toolbar's `Invoice` raised.
 */
export const InvoiceLinesSection = ({ returnOrder }: Props) => {
  const creditedTotal = returnOrder.credits.reduce(
    (total, credit) => total + Number(credit.invoiceTotal ?? 0),
    0,
  );

  return (
    <CollapsibleSection
      title="Invoice lines"
      summary={[
        returnOrder.invoiceLines.length === 0
          ? "Nothing invoiced"
          : `${returnOrder.invoiceLines.length} invoiced line(s)`,
        returnOrder.credits.length === 0
          ? "not credited"
          : `${formatMoney(Math.abs(creditedTotal))} credited`,
      ].join(" · ")}
    >
      <div className="space-y-4 p-3">
        {returnOrder.invoiceLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None of these lines have been invoiced, so there is nothing to
            credit against.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Invoiced</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.invoiceLines.map((line, index) => (
                  <TableRow key={`${line.returnOrderItemUuid}-${index}`}>
                    <TableCell>
                      <Link
                        href={`/invoices/${line.invoiceUuid}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {line.invoiceId ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>Debit</TableCell>
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

        {returnOrder.credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No credit note has been raised for this return yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit note</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell>Credit</TableCell>
                    <TableCell>{formatDateColumn(credit.invoiceDate)}</TableCell>
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
      </div>
    </CollapsibleSection>
  );
};
