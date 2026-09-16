import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { orderLineStatuses, receiptStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { ORDER_LINE_STATUS_LABELS, RECEIPT_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseReceivalFilters = (
  suppliers: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  // The reference's own filter, and the one the screen is read through: what is
  // due in this window.
  {
    key: "deliveryDatePlanned",
    kind: "dateRange",
    label: "Scheduled delivery date",
  },
  {
    key: "arrived",
    kind: "select",
    label: "Arrived?",
    placeholder: "Arrived or not",
    options: [
      { value: "false", label: "Still due" },
      { value: "true", label: "Arrived" },
    ],
  },
  {
    key: "receiptStatus",
    kind: "select",
    label: "Receipt status",
    placeholder: "All receipt statuses",
    options: receiptStatuses.map((status) => ({
      value: status,
      label: RECEIPT_STATUS_LABELS[status],
    })),
  },
  {
    key: "lineStatus",
    kind: "select",
    label: "Line status",
    placeholder: "All line statuses",
    options: orderLineStatuses.map((status) => ({
      value: status,
      label: ORDER_LINE_STATUS_LABELS[status],
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
];
