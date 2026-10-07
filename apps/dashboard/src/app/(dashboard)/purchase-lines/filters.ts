import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { purchaseSourceTypes } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseLineFilters = (
  suppliers: CompanyOption[],
  purchasers: ClerkUserOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  {
    key: "lines",
    kind: "select",
    label: "Lines",
    placeholder: "All lines",
    options: [{ value: "current", label: "Only current purchasing lines" }],
  },
  {
    key: "supplier",
    kind: "select",
    label: "Supplier",
    placeholder: "All suppliers",
    options: suppliers.map((supplier) => ({
      value: supplier.uuid,
      label: companyOptionLabel(supplier),
    })),
  },
  {
    key: "purchaser",
    kind: "select",
    label: "Purchaser",
    placeholder: "All purchasers",
    options: purchasers,
  },
  {
    key: "product",
    kind: "select",
    label: "Product",
    placeholder: "All products",
    options: products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  },
  {
    key: "lineType",
    kind: "select",
    label: "Line type",
    placeholder: "All line types",
    options: purchaseSourceTypes.map((type) => ({
      value: type,
      label: ORDER_SOURCE_TYPE_LABELS[type],
    })),
  },
  { key: "orderDate", kind: "dateRange", label: "Order date" },
  { key: "quantity", kind: "numberRange", label: "Quantity" },
];
