"use client";

import Link from "next/link";
import { exportStockOnLocation } from "@/app/(dashboard)/stock-on-location/actions";
import {
  STOCK_LOT_COLUMNS,
  StockLotColumnKey,
} from "@/app/(dashboard)/stock-on-location/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<StockLotOverviewRow>;
  filters: TableFilterControl[];
};

export const STOCK_LOT_SORTABLE: Partial<Record<StockLotColumnKey, string>> = {
  productCode: "productCode",
  location: "location",
  quantity: "quantity",
  quantityKg: "quantityKg",
  receiptDate: "receiptDate",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

/** The product code opens the lot, as `Show product` does in the reference. */
export const renderStockLotCell = (
  row: StockLotOverviewRow,
  key: StockLotColumnKey,
) =>
  key === "productCode" ? (
    <Link
      href={`/stock/${row.uuid}`}
      className="font-medium underline-offset-4 hover:underline"
    >
      {row.productCode ?? "—"}
    </Link>
  ) : undefined;

export const StockOnLocationTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={STOCK_LOT_COLUMNS}
    sortable={STOCK_LOT_SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={renderStockLotCell}
    exportAction={exportStockOnLocation}
    fileName="stock-on-location"
    searchPlaceholder="Search product, charge or bundle…"
    emptyText="No stock on location found."
    singular="lot"
    plural="lots"
  />
);
