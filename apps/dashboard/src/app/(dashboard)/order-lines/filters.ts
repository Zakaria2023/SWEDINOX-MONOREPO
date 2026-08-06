import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { orderLineStatuses } from "@/lib/enums";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The controls the order-lines toolbar offers, keyed to the bindings in
 * actions.ts. The customer and product lists are loaded on the server and
 * passed in, so this file stays client-safe.
 */
export const orderLineFilters = (
  companies: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  {
    key: "lineStatus",
    kind: "select",
    label: "Line status",
    options: orderLineStatuses.map((status) => ({
      value: status,
      label: ORDER_LINE_STATUS_LABELS[status],
    })),
  },
  {
    key: "company",
    kind: "select",
    label: "Customer",
    placeholder: "All customers",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
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
  { key: "deliveryDate", kind: "dateRange", label: "Delivery date" },
  { key: "amount", kind: "numberRange", label: "Amount" },
];
