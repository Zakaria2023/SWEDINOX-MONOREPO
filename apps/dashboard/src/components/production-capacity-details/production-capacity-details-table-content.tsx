"use client";

import Link from "next/link";
import {
  exportProductionCapacityDetails,
  ProductionCapacityDetailListItem,
} from "@/app/(dashboard)/production-capacity-details/actions";
import {
  PRODUCTION_CAPACITY_DETAIL_COLUMNS,
  ProductionCapacityDetailColumnKey,
} from "@/app/(dashboard)/production-capacity-details/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ProductionCapacityDetailListItem>;
  filters: TableFilterControl[];
};

const renderCell = (
  row: ProductionCapacityDetailListItem,
  key: ProductionCapacityDetailColumnKey,
) => {
  if (key === "order" && row.orderId && row.orderUuid) {
    return (
      <Link
        href={`/orders/${row.orderUuid}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.orderId}
      </Link>
    );
  }
  if (key === "line") {
    return (
      <Link
        href={`/production-capacity-details/${row.uuid}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.lineNumber ?? "View"}
      </Link>
    );
  }
  return undefined;
};

export const ProductionCapacityDetailsTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={PRODUCTION_CAPACITY_DETAIL_COLUMNS}
    rowKey={(row) => row.uuid}
    renderCell={renderCell}
    exportAction={exportProductionCapacityDetails}
    fileName="production-capacity-details"
    searchPlaceholder="Search order, company or product…"
    emptyText="No production capacity details found."
    singular="row"
    plural="rows"
  />
);
