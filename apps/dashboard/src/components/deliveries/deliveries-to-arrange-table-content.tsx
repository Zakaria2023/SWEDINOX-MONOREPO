"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Package } from "lucide-react";
import { DeliveryLineItem } from "@/app/(dashboard)/deliveries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { cn } from "@/lib/helpers";

type Props = {
  lines: DeliveryLineItem[];
};

export const DeliveriesToArrangeTable = ({ lines }: Props) => {
  // The reference acts on a selected row from a toolbar at the top, so the
  // grid has to remember which row that is.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected = lines.find((row) => row.uuid === selectedUuid) ?? null;

  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Show Order",
      icon: <FileText className="size-4" />,
      href: selected ? `/orders/${selected.orderUuid}` : null,
    },
  ];

  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-end">
          <TableExportButton
            tableId="deliveries-to-arrange-table"
            fileName="deliveries-to-arrange"
            sheetName="Deliveries to be arranged without stock reservation"
          />
        </div>
        <TableRowToolbar
          actions={rowActions}
          selectedLabel={
            selected
              ? `${selected.orderId ?? "—"} line ${selected.lineNumber ?? "—"}`
              : null
          }
        />
        <Table id="deliveries-to-arrange-table">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Line</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead className="text-right">Qty(p)</TableHead>
              <TableHead>U(p)</TableHead>
              <TableHead>Product code</TableHead>
              <TableHead>Product description</TableHead>
              <TableHead className="text-right">Length</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No deliveries to arrange.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-muted",
                  )}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/order-lines/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.customerName ?? "View line"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.orderId ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.lineNumber ?? "—"}
                  </TableCell>
                  <TableCell>{row.deliveryDate ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.qtyPlanned}</TableCell>
                  <TableCell>
                    {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.productCode ?? "—"}
                  </TableCell>
                  <TableCell>{row.productName ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {row.lengthMm ?? "—"}
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
