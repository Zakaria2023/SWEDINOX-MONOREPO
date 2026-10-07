"use client";

import Link from "next/link";
import {
  exportProductionWorkOrderLines,
  ProductionWorkOrderLineRow,
} from "@/app/(dashboard)/production-work-order-lines/actions";
import {
  PRODUCTION_WORK_ORDER_LINE_COLUMNS,
  ProductionWorkOrderLineColumnKey,
} from "@/app/(dashboard)/production-work-order-lines/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ProductionWorkOrderLineRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<ProductionWorkOrderLineColumnKey, string>> = {
  workOrderDate: "workOrderDate",
  workOrderNumber: "workOrderNumber",
  status: "status",
  productCode: "productCode",
  kgPlanned: "kgPlanned",
};

export const ProductionWorkOrderLinesTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={PRODUCTION_WORK_ORDER_LINE_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={(row, key) =>
      key === "workOrderNumber" ? (
        <Link
          href={`/production-workorders/${row.workOrderUuid}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.workOrderNumber}
        </Link>
      ) : undefined
    }
    exportAction={exportProductionWorkOrderLines}
    fileName="production-workorders"
    searchPlaceholder="Search product or order…"
    emptyText="No production work order lines."
    singular="line"
    plural="lines"
  />
);
