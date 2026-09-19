import { deliveryStatuses, orderLineStatuses } from "@/lib/enums";
import { DELIVERY_STATUS_LABELS, ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * What the delivery list can be narrowed by.
 *
 * Delivery date first: the question this screen answers is almost always "what
 * is going out today", and without it a reader is scrolling six thousand lines
 * to find tomorrow's.
 */
export const deliveryFilters = (
  customers: Array<{ uuid: string; name: string }>,
): TableFilterControl[] => [
  { key: "deliveryDate", kind: "dateRange", label: "Delivery date" },
  {
    key: "deliveryStatus",
    kind: "select",
    label: "Delivery status",
    placeholder: "All statuses",
    options: deliveryStatuses.map((status) => ({
      value: status,
      label: DELIVERY_STATUS_LABELS[status],
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
    key: "isPickup",
    kind: "select",
    label: "Pick-up",
    placeholder: "Delivered or collected",
    options: [
      { value: "true", label: "Collected" },
      { value: "false", label: "Delivered" },
    ],
  },
  {
    key: "customer",
    kind: "select",
    label: "Customer",
    placeholder: "All customers",
    options: customers.map((customer) => ({
      value: customer.uuid,
      label: customer.name,
    })),
  },
];
