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
  // The reference's two filters on this screen: the line's creation date and
  // a tick for the lines still in play.
  { key: "createdAt", kind: "dateRange", label: "Creation date" },
  { key: "lines", kind: "checkbox", label: "Only current purchasing lines" },
  { key: "number", kind: "numberRange", label: "No." },
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
  { key: "quantity", kind: "numberRange", label: "Quantity" },
];
