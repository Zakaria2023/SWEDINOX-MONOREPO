"use client";

import {
  exportRevenuePerProduct,
  RevenuePerProductRow,
} from "@/app/(dashboard)/revenue-per-product/actions";
import { REVENUE_PER_PRODUCT_COLUMNS } from "@/app/(dashboard)/revenue-per-product/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<RevenuePerProductRow>;
  filters: TableFilterControl[];
};

export const RevenuePerProductTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={REVENUE_PER_PRODUCT_COLUMNS}
    rowKey={(row) =>
      [row.productCode, row.invoiceDate, row.sourceType, row.options, row.priceUnit, row.orderCategory].join("|")
    }
    exportAction={exportRevenuePerProduct}
    fileName="revenue-per-product"
    searchPlaceholder="Search product…"
    emptyText="No invoiced sales."
    singular="row"
    plural="rows"
  />
);
