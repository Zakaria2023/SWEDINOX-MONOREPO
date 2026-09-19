import { TableFilterControl } from "@/lib/table-query";

/**
 * What the advice list can be narrowed by.
 *
 * Supplier first: an advice run ends in a purchase order to one supplier, so
 * that is the cut a buyer actually works in.
 */
export const orderAdviceFilters = (
  suppliers: Array<{ uuid: string; name: string }>,
  adviceCodes: string[],
): TableFilterControl[] => [
  {
    key: "supplier",
    kind: "select",
    label: "Supplier",
    placeholder: "All suppliers",
    options: suppliers.map((supplier) => ({
      value: supplier.uuid,
      label: supplier.name,
    })),
  },
  {
    key: "orderAdviceCode",
    kind: "select",
    label: "Order advice code",
    placeholder: "All codes",
    options: adviceCodes.map((code) => ({ value: code, label: code })),
  },
];
