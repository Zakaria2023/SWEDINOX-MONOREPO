"use client";

import Link from "next/link";
import {
  exportProductPrices,
  ProductPriceRow,
} from "@/app/(dashboard)/product-prices/actions";
import {
  PRODUCT_PRICE_COLUMNS,
  ProductPriceColumnKey,
} from "@/app/(dashboard)/product-prices/columns";
import { RecalculatePricesButton } from "@/components/product-prices/recalculate-prices-button";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<ProductPriceRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<ProductPriceColumnKey, string>> = {
  productCode: "productCode",
  name: "name",
  basePrice: "basePrice",
  markup: "markup",
  fixedSalesPrice: "fixedSalesPrice",
};

export const ProductPricesTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={PRODUCT_PRICE_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    renderCell={(row, key) =>
      key === "productCode" ? (
        <Link
          href={`/products/${row.uuid}`}
          className="font-medium text-primary hover:underline"
        >
          {row.productCode}
        </Link>
      ) : undefined
    }
    exportAction={exportProductPrices}
    fileName="product-prices"
    searchPlaceholder="Search code, old code or product…"
    emptyText="No products."
    singular="product"
    plural="products"
    toolbar={<RecalculatePricesButton />}
  />
);
