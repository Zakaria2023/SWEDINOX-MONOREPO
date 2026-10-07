"use client";

import Link from "next/link";
import {
  CombinedWorkOrderLine,
  exportWarehouseAndProductionWorkOrders,
} from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import {
  COMBINED_WORK_ORDER_COLUMNS,
  CombinedWorkOrderColumnKey,
} from "@/app/(dashboard)/warehouse-and-production-workorders/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<CombinedWorkOrderLine>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<CombinedWorkOrderColumnKey, string>> = {
  workOrderDate: "workOrderDate",
  workOrderNumber: "workOrderNumber",
  releasedAt: "releasedAt",
  workOrderStatus: "workOrderStatus",
};

export const WarehouseAndProductionWorkOrdersTable = ({
  page,
  filters,
}: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={COMBINED_WORK_ORDER_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => `${row.kind}:${row.uuid}`}
    renderCell={(row, key) =>
      key === "workOrderNumber" ? (
        <Link
          href={
            row.kind === "warehouse"
              ? `/warehouse-work-orders/${row.workOrderUuid}`
              : `/production-workorders/${row.workOrderUuid}`
          }
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.workOrderNumber}
        </Link>
      ) : undefined
    }
    exportAction={exportWarehouseAndProductionWorkOrders}
    fileName="warehouse-and-production-workorders"
    searchPlaceholder="Search product, company or work order…"
    emptyText="No work order lines."
    singular="line"
    plural="lines"
  />
);
