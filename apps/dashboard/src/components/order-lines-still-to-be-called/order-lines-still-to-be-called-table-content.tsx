"use client";

import { exportOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import {
  CallOffColumnKey,
  ORDER_LINES_STILL_TO_BE_CALLED_COLUMNS,
} from "@/app/(dashboard)/orders-still-to-be-called/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import type { CallOffLineRow } from "@/lib/server/call-off-lines";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";

type Props = {
  page: Paged<CallOffLineRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<CallOffColumnKey, string>> = {
  order: "order",
  productCode: "productCode",
  customer: "customer",
  deliveryDate: "deliveryDate",
};

export const OrderLinesStillToBeCalledTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={ORDER_LINES_STILL_TO_BE_CALLED_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={(row, key) =>
      key === "order" ? (
        <Link
          href={`/order-lines/${row.uuid}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.orderId}
        </Link>
      ) : undefined
    }
    exportAction={exportOrderLinesStillToBeCalled}
    fileName="order-lines-still-to-be-called"
    searchPlaceholder="Search product, customer or reference…"
    emptyText="No call-off lines."
    singular="line"
    plural="lines"
  />
);
