import Link from "next/link";
import { PaymentListItem } from "@/app/(dashboard)/payments/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney } from "@/lib/helpers";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";

type Props = {
  rows: PaymentListItem[];
};

export const PaymentsTableContent = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              No payments registered yet.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.uuid}
              className={row.reversed ? "text-muted-foreground" : ""}
            >
              <TableCell>{row.paymentDate}</TableCell>
              <TableCell>
                {row.invoiceUuid ? "Received" : "Paid"}
              </TableCell>
              <TableCell>
                {row.invoiceUuid ? (
                  <Link
                    href={`/invoices/${row.invoiceUuid}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    #{row.invoiceId}
                  </Link>
                ) : (
                  `#${row.purchaseInvoiceId ?? "—"}`
                )}
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell>
                {row.method ? PAYMENT_METHOD_LABELS[row.method] : "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.amount))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.discountAmount))}
              </TableCell>
              <TableCell>{row.reversed ? "Reversed" : "Booked"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
