"use client";

import Link from "next/link";
import {
  exportWarehouseWorkOrderLines,
  WarehouseWorkOrderLineRow,
} from "@/app/(dashboard)/warehouse-work-order-lines/actions";
import {
  WAREHOUSE_WORK_ORDER_LINE_COLUMNS,
  WarehouseWorkOrderLineColumnKey,
} from "@/app/(dashboard)/warehouse-work-order-lines/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<WarehouseWorkOrderLineRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<WarehouseWorkOrderLineColumnKey, string>> = {
  type: "type",
  workOrderNumber: "workOrderNumber",
  workOrderDate: "workOrderDate",
  productCode: "productCode",
  status: "status",
  kgPlanned: "kgPlanned",
};

export const WarehouseWorkOrderLinesTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={WAREHOUSE_WORK_ORDER_LINE_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={(row, key) =>
      key === "workOrderNumber" ? (
        <Link
          href={`/warehouse-work-orders/${row.workOrderUuid}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.workOrderNumber}
        </Link>
      ) : undefined
    }
    exportAction={exportWarehouseWorkOrderLines}
    fileName="warehouse-workorders"
    searchPlaceholder="Search product, order or bundle…"
    emptyText="No warehouse work order lines."
    singular="line"
    plural="lines"
  />
);
