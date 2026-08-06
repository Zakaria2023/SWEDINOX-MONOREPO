import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { purchaseOrderStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseOrderFilters = (
  suppliers: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: purchaseOrderStatuses.map((status) => ({
      value: status,
      label: PURCHASE_ORDER_STATUS_LABELS[status],
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
  { key: "orderDate", kind: "dateRange", label: "Order date" },
  { key: "deliveryDate", kind: "dateRange", label: "Delivery date" },
  { key: "amount", kind: "numberRange", label: "Amount" },
];
