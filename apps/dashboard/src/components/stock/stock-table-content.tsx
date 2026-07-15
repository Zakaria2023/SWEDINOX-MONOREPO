"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StockListItem } from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, type SelectOption } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StockCorrectionDialog } from "./stock-correction-dialog";
import { cn } from "@/lib/helpers";
import { stockStatuses } from "@/lib/enums";
import { STOCK_STATUS_LABELS } from "@/lib/labels";

type Props = {
  stock: StockListItem[];
};

const DAYS_PENDING_WARNING_THRESHOLD = 30;

const daysSince = (date: Date) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);

export const StockTable = ({ stock }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [correctingStock, setCorrectingStock] = useState<StockListItem | null>(
    null,
  );

  const statusOptions: SelectOption[] = [
    { value: "", label: "All statuses" },
    ...stockStatuses.map((status) => ({
      value: status,
      label: STOCK_STATUS_LABELS[status],
    })),
  ];

  const companyOptions: SelectOption[] = useMemo(() => {
    const names = Array.from(
      new Set(
        stock
          .map((row) => row.companyName)
          .filter((name): name is string => !!name),
      ),
    ).sort();
    return [
      { value: "", label: "All companies" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [stock]);

  const filteredStock = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stock.filter((row) => {
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }
      if (companyFilter && row.companyName !== companyFilter) {
        return false;
      }
      if (
        query &&
        !`${row.productCode ?? ""} ${row.productName ?? ""}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [stock, search, statusFilter, companyFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select
          value={statusFilter}
          options={statusOptions}
          onValueChange={setStatusFilter}
          className="w-44"
        />
        <Select
          value={companyFilter}
          options={companyOptions}
          onValueChange={setCompanyFilter}
          className="w-56"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead className="text-right">Original / Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending For</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStock.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStock.map((row) => {
                const pendingDays =
                  row.status === "pending" ? daysSince(row.createdAt) : null;

                return (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-medium">
                      {[row.productCode, row.productName]
                        .filter(Boolean)
                        .join(" — ") || "—"}
                    </TableCell>
                    <TableCell>{row.companyName ?? "—"}</TableCell>
                    <TableCell>
                      {row.purchaseOrderId ? (
                        <Link
                          href={`/purchase-orders/${row.purchaseOrderUuid}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {row.purchaseOrderId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.originalQuantity ?? row.quantity} / {row.quantity}
                    </TableCell>
                    <TableCell>{STOCK_STATUS_LABELS[row.status]}</TableCell>
                    <TableCell>
                      {pendingDays === null ? (
                        "—"
                      ) : (
                        <span
                          className={cn({
                            "font-medium text-amber-600":
                              pendingDays >= DAYS_PENDING_WARNING_THRESHOLD,
                          })}
                        >
                          {pendingDays} {pendingDays === 1 ? "day" : "days"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      {row.status !== "cancelled" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCorrectingStock(row)}
                        >
                          Correct
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <StockCorrectionDialog
        stock={correctingStock}
        onOpenChange={(open) => {
          if (!open) {
            setCorrectingStock(null);
          }
        }}
      />
    </div>
  );
};
