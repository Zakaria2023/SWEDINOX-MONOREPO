import { RevenueGroupOption } from "@/app/(dashboard)/products/actions";
import { orderLineStatuses, orderTypes } from "@/lib/enums";
import { ORDER_LINE_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";
import type { SelectSalesOptions } from "@/db/schema/sales-options";

export const optionLineFilters = (
  options: Pick<SelectSalesOptions, "uuid" | "code" | "name">[],
  revenueGroups: RevenueGroupOption[],
): TableFilterControl[] => [
  {
    key: "option",
    kind: "select",
    label: "Option",
    placeholder: "All options",
    options: options.map((option) => ({
      value: option.uuid,
      label: `${option.code} — ${option.name}`,
    })),
  },
  {
    key: "revenueGroup",
    kind: "select",
    label: "Revenue group",
    placeholder: "All revenue groups",
    options: revenueGroups.map((group) => ({
      value: group.uuid,
      label: group.name,
    })),
  },
  {
    key: "lineStatus",
    kind: "select",
    label: "Line status",
    placeholder: "Any status",
    options: orderLineStatuses.map((status) => ({
      value: status,
      label: ORDER_LINE_STATUS_LABELS[status],
    })),
  },
  {
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "Any order type",
    options: orderTypes.map((type) => ({
      value: type,
      label: ORDER_TYPE_LABELS[type],
    })),
  },
];
