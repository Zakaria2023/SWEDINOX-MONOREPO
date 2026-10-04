"use client";

import Link from "next/link";

import { PurchaseOrderToReceiveRow } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { ReceiveLineButton } from "@/components/purchase-orders-to-be-received/receive-line-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateColumn, formatMoney, formatNumber } from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";
import { ReceiveGoodsButton } from "@/components/purchase-orders-to-be-received/receive-goods-button";

type Props = {
  rows: PurchaseOrderToReceiveRow[];
};

export const PurchaseOrdersToBeReceivedTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <TableExportButton
          tableId="purchase-orders-to-be-received-table"
          fileName="purchase-orders-to-be-received"
          sheetName="Purchase orders to be received"
        />
        <ReceiveGoodsButton />
      </div>
      <Table id="purchase-orders-to-be-received-table">
        <TableHeader>
          <TableRow>
            <TableHead>Purchase order</TableHead>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Supplier reference</TableHead>
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
            <TableHead data-export-ignore className="text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={16}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase orders awaiting delivery.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.purchaseOrderItemUuid}>
                {/* 🔴 The order's own number, which this screen never showed.
                    The column called `Purchase order` held the supplier's
                    reference — empty on almost every order — so nothing here
                    named the document a buyer came to receive. */}
                <TableCell className="font-medium whitespace-nowrap">
                  <Link
                    href={`/purchase-orders/${row.purchaseOrderUuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.purchaseOrderId}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.lineNumber === null ? "—" : row.lineNumber * 10}
                </TableCell>
                <TableCell>{row.productCode ?? "—"}</TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell>{row.reference ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.companyCode ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.status}
                    label={
                      row.status
                        ? PURCHASE_ORDER_STATUS_LABELS[row.status]
                        : null
                    }
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateColumn(row.orderDate)}
                </TableCell>
                <TableCell className="text-right">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.kgPurchased)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.kgReceived)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(row.kgStillToReceive)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.orderAmount)}
                </TableCell>
                <TableCell>
                  {row.purchaser ?? row.purchaserInitials ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <ReceiveLineButton
                    purchaseOrderItemUuid={row.purchaseOrderItemUuid}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
