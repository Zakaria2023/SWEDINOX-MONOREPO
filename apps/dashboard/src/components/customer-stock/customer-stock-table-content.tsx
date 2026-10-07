"use client";

import { exportCustomerStock } from "@/app/(dashboard)/customer-stock/actions";
import { CUSTOMER_STOCK_LOT_COLUMNS } from "@/app/(dashboard)/stock-on-location/columns";
import {
  renderStockLotCell,
  STOCK_LOT_SORTABLE,
} from "@/components/stock-on-location/stock-on-location-table-content";
import { OverviewTable } from "@/components/ui/overview-table";
import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<StockLotOverviewRow>;
  filters: TableFilterControl[];
};

export const CustomerStockTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={CUSTOMER_STOCK_LOT_COLUMNS}
    sortable={STOCK_LOT_SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={renderStockLotCell}
    exportAction={exportCustomerStock}
    fileName="customer-stock-on-location"
    searchPlaceholder="Search product, charge or bundle…"
    emptyText="No customer stock on location."
    singular="lot"
    plural="lots"
  />
);
