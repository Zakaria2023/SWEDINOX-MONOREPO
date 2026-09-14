"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  FinanciallyBlockedRow,
  unblockOrder,
} from "@/app/(dashboard)/financially-blocked/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";
import { cn, formatDateColumn, formatMoney } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: FinanciallyBlockedRow[];
};

type UnblockButtonProps = {
  orderUuid: string;
};

const UnblockButton = ({ orderUuid }: UnblockButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUnblock = () =>
    startTransition(async () => {
      await unblockOrder(orderUuid);
      router.refresh();
    });

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={handleUnblock}
    >
      {isPending ? "Unblocking..." : "Unblock"}
    </Button>
  );
};

export const FinanciallyBlockedTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="financially-blocked-table"
          fileName="financially-blocked"
          sheetName="Financially blocked quotes and orders"
        />
      </div>
      <Table id="financially-blocked-table">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Debtor</TableHead>
            <TableHead className="text-right">Debtor no.</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Blocking reason</TableHead>
            <TableHead>Payment term</TableHead>
            <TableHead className="text-right">Order amount</TableHead>
            <TableHead className="text-right">Open entrees</TableHead>
            <TableHead className="text-right">Credit limit</TableHead>
            <TableHead className="text-right">Credit space</TableHead>
            <TableHead className="text-center">Company blocked?</TableHead>
            <TableHead data-export-ignore className="text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={13}
                className="h-24 text-center text-muted-foreground"
              >
                No financially blocked quotes or orders.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.kind}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {row.code ?? "—"}
                </TableCell>
                <TableCell>{row.debtor}</TableCell>
                <TableCell className="text-right">{row.debtorNumber}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateColumn(row.deliveryDate)}
                </TableCell>
                <TableCell>{row.blockingReason ?? "—"}</TableCell>
                <TableCell>
                  {row.paymentTerms
                    ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms]
                    : "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.openEntrees)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.creditLimit)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right whitespace-nowrap",
                    row.creditSpace < 0 && "font-semibold text-red-600",
                  )}
                >
                  {formatMoney(row.creditSpace)}
                </TableCell>
                <TableCell className="text-center">
                  {row.companyBlocked ? "Yes" : "No"}
                </TableCell>
                <TableCell className="text-right">
                  {row.kind === "Order" ? (
                    <UnblockButton orderUuid={row.uuid} />
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
