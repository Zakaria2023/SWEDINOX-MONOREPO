"use client";

import { FinanciallyBlockedRow } from "@/app/(dashboard)/financially-blocked/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";
import { cn } from "@/lib/helpers";

type Props = {
  rows: FinanciallyBlockedRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (value: string | Date | null) => {
  if (!value) {
    return "—";
  }
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
};

export const FinanciallyBlockedTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Debtor</TableHead>
          <TableHead className="text-right">Debtor no.</TableHead>
          <TableHead>1st delivery date</TableHead>
          <TableHead>Blocking reason</TableHead>
          <TableHead>Payment term</TableHead>
          <TableHead className="text-right">Order amount</TableHead>
          <TableHead className="text-right">Open entrees</TableHead>
          <TableHead className="text-right">Credit limit</TableHead>
          <TableHead className="text-right">Credit space</TableHead>
          <TableHead className="text-center">Company blocked?</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={12}
              className="h-24 text-center text-muted-foreground"
            >
              No financially blocked quotes or orders.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={`${row.kind}-${row.uuid}`}>
              <TableCell>{row.kind}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {row.code ?? "—"}
              </TableCell>
              <TableCell>{row.debtor}</TableCell>
              <TableCell className="text-right">{row.debtorNumber}</TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.deliveryDate)}
              </TableCell>
              <TableCell>{row.blockingReason ?? "—"}</TableCell>
              <TableCell>
                {row.paymentTerms
                  ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms]
                  : "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.amount)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.openEntrees)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.creditLimit)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right whitespace-nowrap",
                  row.creditSpace < 0 && "font-semibold text-red-600",
                )}
              >
                {money(row.creditSpace)}
              </TableCell>
              <TableCell className="text-center">
                {row.companyBlocked ? "Yes" : "No"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
