"use client";

import Link from "next/link";
import {
  exportProducts,
  ProductListItem,
} from "@/app/(dashboard)/products/actions";
import {
  PRODUCT_COLUMNS,
  ProductColumnKey,
} from "@/app/(dashboard)/products/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { TableNewLink } from "@/components/ui/table-new-link";
import { formatMoney } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

// The columns a header may sort on, matching the keys actions.ts declared.
const SORTABLE: Partial<Record<ProductColumnKey, string>> = {
  productCode: "productCode",
  name: "name",
  subgroup: "productGroup",
  grossPrice: "basePrice",
  createdAt: "createdAt",
};

type Props = {
  page: Paged<ProductListItem>;
  filters: TableFilterControl[];
};

// The product code opens the product; the gross price reads as money, the way
// the reference prints `€ 0,00`. Every other cell is its column's export value.
const renderCell = (row: ProductListItem, key: ProductColumnKey) => {
  if (key === "productCode") {
    return (
      <Link
        href={`/products/${row.uuid}`}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {row.productCode}
      </Link>
    );
  }
  if (key === "grossPrice") {
    return formatMoney(Number(row.basePrice ?? 0));
  }
  return undefined;
};

export const ProductsTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={PRODUCT_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={renderCell}
    exportAction={exportProducts}
    fileName="products"
    searchPlaceholder="Search product code, name or commodity code…"
    emptyText="No products found."
    singular="product"
    plural="products"
    toolbar={<TableNewLink href="/products/new">New Product</TableNewLink>}
  />
);
