import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { openPurchaseOrderStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseOrderToReceiveFilters = (
  suppliers: CompanyOption[],
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
  // Only an order still in flight has a line to receive, so only the open
  // statuses are offered.
  {
    key: "status",
    kind: "select",
    label: "Status",
    placeholder: "All open statuses",
    options: openPurchaseOrderStatuses.map((status) => ({
      value: status,
      label: PURCHASE_ORDER_STATUS_LABELS[status],
    })),
  },
  { key: "orderDate", kind: "dateRange", label: "Order date" },
];
