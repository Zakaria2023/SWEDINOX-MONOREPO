import { TableFilterControl } from "@/lib/table-query";

/**
 * The reference narrows this screen by customer and nothing else; the
 * customers offered are the ones with a blocked line.
 */
export const blockedDeliveryFilters = (
  customers: Array<{ uuid: string; name: string }>,
): TableFilterControl[] => [
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
