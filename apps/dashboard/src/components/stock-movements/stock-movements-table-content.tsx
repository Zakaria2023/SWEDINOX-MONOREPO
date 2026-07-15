"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StockMovementListItem } from "@/app/(dashboard)/stock-movements/actions";
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
import { stockMovementReasons, stockMovementTypes } from "@/lib/enums";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  stockMovements: StockMovementListItem[];
};

const typeOptions: SelectOption[] = [
  { value: "", label: "All types" },
  ...stockMovementTypes.map((type) => ({
    value: type,
    label: STOCK_MOVEMENT_TYPE_LABELS[type],
  })),
];

const reasonOptions: SelectOption[] = [
  { value: "", label: "All reasons" },
  ...stockMovementReasons.map((reason) => ({
    value: reason,
    label: STOCK_MOVEMENT_REASON_LABELS[reason],
  })),
];

export const StockMovementsTable = ({ stockMovements }: Props) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return stockMovements.filter((row) => {
      if (typeFilter && row.type !== typeFilter) {
        return false;
      }
      if (reasonFilter && row.reason !== reasonFilter) {
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
      const createdAt = new Date(row.createdAt);
      if (from && createdAt < from) {
        return false;
      }
      if (to && createdAt > new Date(to.getTime() + 86_400_000 - 1)) {
        return false;
      }
      return true;
    });
  }, [stockMovements, search, typeFilter, reasonFilter, fromDate, toDate]);

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
          value={typeFilter}
          options={typeOptions}
          onValueChange={setTypeFilter}
          className="w-40"
        />
        <Select
          value={reasonFilter}
          options={reasonOptions}
          onValueChange={setReasonFilter}
          className="w-56"
        />
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    {[row.productCode, row.productName]
                      .filter(Boolean)
                      .join(" — ") || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.type === "in"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                      }
                    >
                      {STOCK_MOVEMENT_TYPE_LABELS[row.type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>{STOCK_MOVEMENT_REASON_LABELS[row.reason]}</div>
                    {row.note && (
                      <div className="text-xs text-muted-foreground">
                        {row.note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell>
                    {row.purchaseOrderId ? (
                      <Link
                        href={`/purchase-orders/${row.purchaseOrderUuid}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Purchase Order #{row.purchaseOrderId}
                      </Link>
                    ) : row.purchaseInvoiceId ? (
                      <Link
                        href={`/purchase-invoices/${row.purchaseInvoiceUuid}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Purchase Invoice #{row.purchaseInvoiceId}
                      </Link>
                    ) : row.orderId ? (
                      <Link
                        href={`/orders/${row.orderUuid}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Order #{row.orderId}
                      </Link>
                    ) : row.invoiceId ? (
                      <Link
                        href={`/invoices/${row.invoiceUuid}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Invoice #{row.invoiceId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleString("en-GB")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
