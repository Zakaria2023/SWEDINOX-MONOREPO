"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteRevenueBudget,
  RevenueBudgetRow,
} from "@/app/(dashboard)/revenue-budgets/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";
import { MONTHS } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/helpers";

type Props = {
  rows: RevenueBudgetRow[];
};

type DeleteBudgetButtonProps = {
  uuid: string;
};

const DeleteBudgetButton = ({ uuid }: DeleteBudgetButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () =>
    startTransition(async () => {
      const result = await deleteRevenueBudget(uuid);
      setError(result.error ?? null);
      router.refresh();
    });

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
};

export const RevenueBudgetsTable = ({ rows }: Props) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <TableExportButton
        tableId="revenue-budgets-table"
        fileName="revenue-budgets"
        sheetName="Revenue budgets"
      />
    </div>
    <Table id="revenue-budgets-table">
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Revenue stock</TableHead>
          <TableHead className="text-right">Revenue cross-dock</TableHead>
          <TableHead className="text-right">Revenue ex factory</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Profit % stock</TableHead>
          <TableHead className="text-right">Profit % cross-dock</TableHead>
          <TableHead className="text-right">Profit % ex factory</TableHead>
          <TableHead data-export-ignore className="text-right">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              No budget set for this year.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{MONTHS[row.month - 1] ?? row.month}</TableCell>
              <TableCell>
                {[row.revenueGroupNumber, row.revenueGroupName]
                  .filter(Boolean)
                  .join(" — ") || "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.revenueStock))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.revenueCrossDock))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(Number(row.revenueFactory))}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(
                  Number(row.weightStock) +
                    Number(row.weightCrossDock) +
                    Number(row.weightFactory),
                )}
              </TableCell>
              <TableCell className="text-right">
                {row.profitPercentageStock}%
              </TableCell>
              <TableCell className="text-right">
                {row.profitPercentageCrossDock}%
              </TableCell>
              <TableCell className="text-right">
                {row.profitPercentageFactory}%
              </TableCell>
              <TableCell className="text-right">
                <DeleteBudgetButton uuid={row.uuid} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
