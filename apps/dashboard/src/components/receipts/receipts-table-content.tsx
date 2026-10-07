"use client";

import { exportReceipts, ReceiptRow } from "@/app/(dashboard)/receipts/actions";
import {
  RECEIPT_COLUMNS,
  ReceiptColumnKey,
} from "@/app/(dashboard)/receipts/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ReceiptRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<ReceiptColumnKey, string>> = {
  completedOn: "completedOn",
  company: "companyName",
  product: "productCode",
  orderNumber: "orderNumber",
  kg: "kg",
};

export const ReceiptsTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={RECEIPT_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    exportAction={exportReceipts}
    fileName="receipts"
    searchPlaceholder="Search product, company or order…"
    emptyText="No receipts."
    singular="receipt"
    plural="receipts"
  />
);
