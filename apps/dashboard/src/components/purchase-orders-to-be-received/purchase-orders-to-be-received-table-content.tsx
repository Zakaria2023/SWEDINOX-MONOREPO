"use client";

import Link from "next/link";

import {
  exportPurchaseOrdersToBeReceived,
  PurchaseOrderToReceiveRow,
} from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import {
  PURCHASE_ORDER_TO_RECEIVE_COLUMNS,
  PurchaseOrderToReceiveColumnKey,
} from "@/app/(dashboard)/purchase-orders-to-be-received/columns";
import { ReceiveGoodsButton } from "@/components/purchase-orders-to-be-received/receive-goods-button";
import { ReceiveLineButton } from "@/components/purchase-orders-to-be-received/receive-line-button";
import { OverviewTable } from "@/components/ui/overview-table";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<PurchaseOrderToReceiveRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<PurchaseOrderToReceiveColumnKey, string>> = {
  purchaseOrderId: "purchaseOrderId",
  productCode: "productCode",
  supplierName: "supplierName",
  status: "status",
  orderDate: "orderDate",
  orderAmount: "orderAmount",
};

const renderCell = (
  row: PurchaseOrderToReceiveRow,
  key: PurchaseOrderToReceiveColumnKey,
) => {
  switch (key) {
    // 🔴 The order's own number, which this screen never showed. The column
    // called `Purchase order` held the supplier's reference — empty on almost
    // every order — so nothing here named the document a buyer came to
    // receive.
    case "purchaseOrderId":
      return (
        <Link
          href={`/purchase-orders/${row.purchaseOrderUuid}`}
          className="font-medium whitespace-nowrap text-primary hover:underline"
        >
          {row.purchaseOrderId}
        </Link>
      );
    case "status":
      return (
        <StatusBadge
          value={row.status}
          label={row.status ? PURCHASE_ORDER_STATUS_LABELS[row.status] : null}
        />
      );
    case "orderAmount":
      return (
        <span className="block text-right whitespace-nowrap">
          {formatMoney(row.orderAmount)}
        </span>
      );
    default:
      return undefined;
  }
};

/**
 * The reference acts on the selected line from the toolbar above the grid —
 * pick a row, then press `Receive` — rather than a button at the end of every
 * row, which on a table this wide sat off the right-hand edge of the screen.
 */
const renderSelection = (selected: PurchaseOrderToReceiveRow | null) => (
  <div className="flex flex-wrap items-start gap-2">
    <span className="me-1 self-center text-sm text-muted-foreground">
      {selected ? (
        <>
          Selected:{" "}
          <span className="text-foreground">
            {selected.purchaseOrderId} line{" "}
            {selected.lineNumber === null ? "—" : selected.lineNumber * 10}
          </span>
        </>
      ) : (
        "Select a row to act on it"
      )}
    </span>
    <ReceiveLineButton
      key={selected?.purchaseOrderItemUuid ?? "none"}
      purchaseOrderItemUuid={selected?.purchaseOrderItemUuid ?? null}
    />
    <RelatedRecordsBar
      records={[
        {
          label: "Show purchase order",
          href: selected ? `/purchase-orders/${selected.purchaseOrderUuid}` : null,
        },
      ]}
    />
  </div>
);

export const PurchaseOrdersToBeReceivedTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={PURCHASE_ORDER_TO_RECEIVE_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.purchaseOrderItemUuid}
    renderCell={renderCell}
    selectionToolbar={renderSelection}
    toolbar={<ReceiveGoodsButton />}
    exportAction={exportPurchaseOrdersToBeReceived}
    fileName="purchase-orders-to-be-received"
    searchPlaceholder="Search order, product, supplier or reference…"
    emptyText="No purchase orders awaiting delivery."
    singular="line"
    plural="lines"
  />
);
