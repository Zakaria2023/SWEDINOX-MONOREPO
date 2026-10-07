"use client";

import Link from "next/link";
import {
  exportSuppliers,
  SupplierRow,
} from "@/app/(dashboard)/suppliers/actions";
import {
  SUPPLIER_COLUMNS,
  SupplierColumnKey,
} from "@/app/(dashboard)/suppliers/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged } from "@/lib/table-query";

type Props = {
  page: Paged<SupplierRow>;
};

const SORTABLE: Partial<Record<SupplierColumnKey, string>> = {
  companyName: "companyName",
  companyCode: "companyCode",
  searchCode3: "searchCode3",
};

export const SuppliersTable = ({ page }: Props) => (
  <OverviewTable
    page={page}
    filters={[]}
    columns={SUPPLIER_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.companyUuid}
    renderCell={(row, key) =>
      key === "companyName" ? (
        <Link
          href={`/companies/${row.companyUuid}`}
          className="font-medium text-primary hover:underline"
        >
          {row.companyName}
        </Link>
      ) : undefined
    }
    exportAction={exportSuppliers}
    fileName="suppliers"
    searchPlaceholder="Search company or search code…"
    emptyText="No suppliers."
    singular="supplier"
    plural="suppliers"
  />
);
