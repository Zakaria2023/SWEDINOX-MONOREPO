import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseLineFilters = (
  suppliers: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
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
    key: "product",
    kind: "select",
    label: "Product",
    placeholder: "All products",
    options: products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  },
  { key: "orderDate", kind: "dateRange", label: "Order date" },
  { key: "quantity", kind: "numberRange", label: "Quantity" },
];
