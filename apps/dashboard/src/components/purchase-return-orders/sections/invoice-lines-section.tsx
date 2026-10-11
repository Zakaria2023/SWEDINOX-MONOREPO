import Link from "next/link";
import { PurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDateColumn, formatMoney } from "@/lib/helpers";

type Props = {
  credits: PurchaseReturnOrderDetail["credits"];
};

/** The supplier's credit notes against a saved return. */
export const InvoiceLinesSection = ({ credits }: Props) => {
  const creditedTotal = credits.reduce(
    (total, credit) => total + Number(credit.invoiceTotal ?? 0),
    0,
  );

  return (
    <CollapsibleSection
      title="Invoice lines"
      summary={
        credits.length === 0
          ? "Not credited"
          : `${formatMoney(Math.abs(creditedTotal))} credited`
      }
    >
      <div className="p-3">
        {credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The supplier has not credited this return yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit note</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.uuid}>
                  <TableCell>
                    <Link
                      href={`/purchase-invoices/${credit.uuid}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {credit.id}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateColumn(credit.invoiceDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(credit.materials ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(credit.invoiceTotal ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(credit.outstanding))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </CollapsibleSection>
  );
};
