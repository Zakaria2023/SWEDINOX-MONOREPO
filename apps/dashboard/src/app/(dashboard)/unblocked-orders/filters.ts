import { orderDeblockTypes } from "@/lib/enums";
import { ORDER_DEBLOCK_TYPE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The two axes this screen is actually read along: which block was lifted, and
 * by whom. A financial release lands within the hour and a commercial one takes
 * days, so the type is the first thing anybody filters on.
 */
export const unblockedOrderFilters = (
  unblockers: Array<{ value: string; label: string }>,
  regions: string[],
): TableFilterControl[] => [
  {
    key: "deblockType",
    kind: "select",
    label: "Deblock type",
    placeholder: "All types",
    options: orderDeblockTypes.map((type) => ({
      value: type,
      label: ORDER_DEBLOCK_TYPE_LABELS[type],
    })),
  },
  {
    key: "deblockedBy",
    kind: "select",
    label: "Deblocked by",
    placeholder: "Anyone",
    options: unblockers,
  },
  { key: "deblockDate", kind: "dateRange", label: "Deblock date" },
  {
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions.map((region) => ({ value: region, label: region })),
  },
];
