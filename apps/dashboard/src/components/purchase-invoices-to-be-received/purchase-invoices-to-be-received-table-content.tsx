"use client";

import Link from "next/link";

import {
  exportPurchaseInvoicesToBeReceived,
  PurchaseInvoicesToReceivePage,
  PurchaseInvoiceToReceiveRow,
} from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import {
  PURCHASE_INVOICE_TO_RECEIVE_COLUMNS,
  PurchaseInvoiceToReceiveColumnKey,
} from "@/app/(dashboard)/purchase-invoices-to-be-received/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { formatMoney } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

type Props = {
  page: PurchaseInvoicesToReceivePage;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<PurchaseInvoiceToReceiveColumnKey, string>> = {
  purchaseOrderId: "purchaseOrderId",
  supplierName: "supplierName",
  orderDate: "orderDate",
  scheduledDeliveryDate: "scheduledDeliveryDate",
  amount: "amount",
};

const renderCell = (
  row: PurchaseInvoiceToReceiveRow,
  key: PurchaseInvoiceToReceiveColumnKey,
) => {
  switch (key) {
    // The order's own number, which this screen never showed — its
    // `Purchase order` column held the supplier's reference, empty on almost
    // every order.
    case "purchaseOrderId":
      return (
        <Link
          href={`/purchase-orders/${row.purchaseOrderUuid}`}
          className="font-medium whitespace-nowrap text-primary hover:underline"
        >
          {row.purchaseOrderId}
        </Link>
      );
    case "amount":
      return (
        <span className="block text-right whitespace-nowrap">
          {formatMoney(row.amount)}
        </span>
      );
    default:
      return undefined;
  }
};

const renderSelection = (selected: PurchaseInvoiceToReceiveRow | null) => (
  <RelatedRecordsBar
    records={[
      {
        label: "Show purchase order",
        href: selected ? `/purchase-orders/${selected.purchaseOrderUuid}` : null,
      },
    ]}
  />
);

export const PurchaseInvoicesToBeReceivedTable = ({ page, filters }: Props) => (
  <div className="space-y-2">
    <OverviewTable
      page={page}
      filters={filters}
      columns={PURCHASE_INVOICE_TO_RECEIVE_COLUMNS}
      sortable={SORTABLE}
      rowKey={(row) => row.purchaseOrderUuid}
      renderCell={renderCell}
      selectionToolbar={renderSelection}
      exportAction={exportPurchaseInvoicesToBeReceived}
      fileName="purchase-invoices-to-be-received"
      searchPlaceholder="Search order, supplier or reference…"
      emptyText="No purchase invoices awaited."
      singular="purchase order"
      plural="purchase orders"
    />
    {/* The total of every matching order, not just the page on show. */}
    <p className="text-right text-sm font-semibold">
      Total {formatMoney(page.totalAmount)}
    </p>
  </div>
);
