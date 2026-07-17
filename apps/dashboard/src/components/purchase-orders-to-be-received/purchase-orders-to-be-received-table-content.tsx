"use client";

import { PurchaseOrderToReceiveRow } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  rows: PurchaseOrderToReceiveRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const kg = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (value: string | Date | null) => {
  if (!value) {
    return "—";
  }
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
};

export const PurchaseOrdersToBeReceivedTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Purchase order</TableHead>
          <TableHead className="text-right">Company code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Order date</TableHead>
          <TableHead className="text-right">Group no.</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Kg purchased</TableHead>
          <TableHead className="text-right">Kg received</TableHead>
          <TableHead className="text-right">Kg still to receive</TableHead>
          <TableHead className="text-right">Order amount</TableHead>
          <TableHead>Purchaser</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={12}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase orders awaiting delivery.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.purchaseOrderItemUuid}>
              <TableCell className="font-medium">
                {row.supplierName ?? "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.companyCode ?? "—"}
              </TableCell>
              <TableCell>
                {row.status ? PURCHASE_ORDER_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.orderDate)}
              </TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell className="text-right">{kg(row.kgPurchased)}</TableCell>
              <TableCell className="text-right">{kg(row.kgReceived)}</TableCell>
              <TableCell className="text-right font-medium">
                {kg(row.kgStillToReceive)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.orderAmount)}
              </TableCell>
              <TableCell>
                {row.purchaser ?? row.purchaserInitials ?? "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
