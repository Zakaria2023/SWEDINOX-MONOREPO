"use client";

import {
  exportSupplierRevenue,
  SupplierRevenueRow,
} from "@/app/(dashboard)/supplier-revenue/actions";
import { SUPPLIER_REVENUE_COLUMNS } from "@/app/(dashboard)/supplier-revenue/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<SupplierRevenueRow>;
  filters: TableFilterControl[];
};

export const SupplierRevenueTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={SUPPLIER_REVENUE_COLUMNS}
    rowKey={(row) => row.key}
    exportAction={exportSupplierRevenue}
    fileName="supplier-revenue"
    searchPlaceholder="Search supplier…"
    emptyText="No supplier revenue found."
    singular="row"
    plural="rows"
  />
);
