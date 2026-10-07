"use client";

import {
  exportSupplierRevenuePerRevenueGroup,
  SupplierRevenuePerGroupRow,
} from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import { SUPPLIER_REVENUE_PER_GROUP_COLUMNS } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<SupplierRevenuePerGroupRow>;
  filters: TableFilterControl[];
};

export const SupplierRevenuePerGroupTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={SUPPLIER_REVENUE_PER_GROUP_COLUMNS}
    rowKey={(row) => row.key}
    exportAction={exportSupplierRevenuePerRevenueGroup}
    fileName="supplier-revenue-per-revenue-group"
    searchPlaceholder="Search supplier or revenue group…"
    emptyText="No supplier revenue found."
    singular="row"
    plural="rows"
  />
);
