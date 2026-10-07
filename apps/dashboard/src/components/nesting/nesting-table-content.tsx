"use client";

import Link from "next/link";
import {
  exportNesting,
  NestingListItem,
} from "@/app/(dashboard)/nesting/actions";
import {
  NESTING_COLUMNS,
  NestingColumnKey,
} from "@/app/(dashboard)/nesting/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<NestingListItem>;
  filters: TableFilterControl[];
};

const renderCell = (row: NestingListItem, key: NestingColumnKey) => {
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
        href={`/nesting/${row.uuid}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.lineNumber ?? "View"}
      </Link>
    );
  }
  return undefined;
};

export const NestingTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={NESTING_COLUMNS}
    rowKey={(row) => row.uuid}
    renderCell={renderCell}
    exportAction={exportNesting}
    fileName="nesting"
    searchPlaceholder="Search order, company, product or nest…"
    emptyText="No nesting rows found."
    singular="row"
    plural="rows"
  />
);
