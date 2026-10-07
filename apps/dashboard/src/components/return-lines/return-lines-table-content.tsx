"use client";

import Link from "next/link";
import {
  exportReturnLines,
  ReturnLineRow,
} from "@/app/(dashboard)/return-lines/actions";
import {
  ReturnLineColumnKey,
  returnLineColumns,
} from "@/app/(dashboard)/return-lines/columns";
import { GenerateReturnLinesButton } from "@/components/return-lines/generate-return-lines-button";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ReturnLineRow>;
  filters: TableFilterControl[];
  userNames: Record<string, string>;
};

const SORTABLE: Partial<Record<ReturnLineColumnKey, string>> = {
  order: "order",
  createdAt: "createdAt",
  productCode: "productCode",
  customer: "customer",
  amount: "amount",
  deliveryDate: "deliveryDate",
};

export const ReturnLinesTable = ({ page, filters, userNames }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={returnLineColumns(userNames)}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={(row, key) =>
      key === "order" ? (
        <Link
          href={`/return-lines/${row.uuid}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.returnOrderId === null ? `#${row.id}` : `R${row.returnOrderId}`}
        </Link>
      ) : undefined
    }
    exportAction={exportReturnLines}
    fileName="return-lines"
    searchPlaceholder="Search product, customer or reference…"
    emptyText="No return lines."
    singular="line"
    plural="lines"
    toolbar={<GenerateReturnLinesButton />}
  />
);
