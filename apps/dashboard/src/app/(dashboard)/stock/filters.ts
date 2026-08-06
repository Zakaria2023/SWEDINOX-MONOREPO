import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { stockStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { STOCK_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const stockFilters = (
  products: ProductOption[],
  locations: LocationOption[],
  suppliers: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: stockStatuses.map((status) => ({
      value: status,
      label: STOCK_STATUS_LABELS[status],
    })),
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
    key: "location",
    kind: "select",
    label: "Location",
    placeholder: "All locations",
    options: locations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
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
  { key: "receiptDate", kind: "dateRange", label: "Receipt date" },
  { key: "quantity", kind: "numberRange", label: "Quantity" },
  {
    key: "blocked",
    kind: "select",
    label: "Blocked",
    placeholder: "Any",
    options: [
      { value: "true", label: "Blocked" },
      { value: "false", label: "Not blocked" },
    ],
  },
];
